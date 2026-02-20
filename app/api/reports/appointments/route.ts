import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserClinicId } from "@/lib/clinic";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clinicId = await getUserClinicId(session.user.id);
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic assigned" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    const where: Prisma.AppointmentWhereInput = {
      clinicId,
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate + "T23:59:59.999Z");
    }

    if (doctorId && doctorId !== "all") {
      where.doctorId = doctorId;
    }

    if (status && status !== "all") {
      const statusList = status.split(",") as Prisma.EnumAppointmentStatusFilter["in"];
      where.status = { in: statusList };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
      },
    });

    const totalAppointments = appointments.length;
    const statusStats = appointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const doctorStats = appointments.reduce((acc, a) => {
      const doctorName = a.doctor.name;
      acc[doctorName] = (acc[doctorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyStats = appointments.reduce((acc, a) => {
      const dateKey = format(a.startTime, "yyyy-MM-dd");
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completed = statusStats["COMPLETED"] || 0;
    const cancelled = statusStats["CANCELLED"] || 0;
    const noShow = statusStats["NO_SHOW"] || 0;
    const totalForAttendance = completed + cancelled + noShow + (statusStats["CONFIRMED"] || 0);
    const attendanceRate = totalForAttendance > 0 
      ? Math.round((completed / totalForAttendance) * 100) 
      : 0;

    const formattedAppointments = appointments.map((a) => ({
      id: a.id.toString(),
      startTime: a.startTime.toISOString(),
      endTime: a.endTime?.toISOString(),
      dateFormatted: format(a.startTime, "dd/MM/yyyy", { locale: es }),
      timeFormatted: format(a.startTime, "HH:mm", { locale: es }),
      patientName: `${a.patient.firstName} ${a.patient.middleName ? a.patient.middleName + " " : ""}${a.patient.lastName}`,
      doctorName: a.doctor.name,
      specialty: a.doctor.specialty || "General",
      status: a.status,
      reason: a.reason,
      notes: a.notes,
    }));

    return NextResponse.json({
      appointments: formattedAppointments,
      summary: {
        totalAppointments,
        attendanceRate,
        statusDistribution: Object.entries(statusStats).map(([label, value]) => ({
          label,
          value,
          percentage: totalAppointments > 0 ? Math.round((value / totalAppointments) * 100) : 0,
        })),
        doctorDistribution: Object.entries(doctorStats)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        dailyDistribution: Object.entries(dailyStats)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    console.error("Error generating appointments report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte de citas" },
      { status: 500 }
    );
  }
}
