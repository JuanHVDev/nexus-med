import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserClinicId } from "@/lib/clinic";
import { calculateAge } from "@/lib/utils";
import type { Prisma, Gender, BloodType } from "@/generated/prisma/client";

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
    const gender = searchParams.get("gender");
    const bloodType = searchParams.get("bloodType");

    const where: Prisma.PatientWhereInput = {
      clinicId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
    }

    if (gender && gender !== "all") {
      where.gender = gender.toUpperCase() as Gender;
    }

    if (bloodType && bloodType !== "all") {
      where.bloodType = bloodType as BloodType;
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            appointments: true,
            medicalNotes: true,
          },
        },
      },
    });

    const totalPatients = patients.length;
    const genderStats = patients.reduce((acc, p) => {
      acc[p.gender] = (acc[p.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bloodTypeStats = patients.reduce((acc, p) => {
      const bt = p.bloodType || "No especificado";
      acc[bt] = (acc[bt] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const formattedPatients = patients.map((p) => ({
      id: p.id.toString(),
      firstName: p.firstName,
      lastName: p.lastName,
      middleName: p.middleName,
      fullName: `${p.firstName} ${p.middleName ? p.middleName + " " : ""}${p.lastName}`,
      curp: p.curp,
      birthDate: p.birthDate?.toISOString(),
      age: p.birthDate ? calculateAge(p.birthDate) : null,
      gender: p.gender,
      bloodType: p.bloodType,
      phone: p.phone,
      email: p.email,
      createdAt: p.createdAt.toISOString(),
      appointmentsCount: p._count.appointments,
      consultationsCount: p._count.medicalNotes,
    }));

    return NextResponse.json({
      patients: formattedPatients,
      summary: {
        totalPatients,
        genderDistribution: Object.entries(genderStats).map(([label, value]) => ({
          label,
          value,
          percentage: totalPatients > 0 ? Math.round((value / totalPatients) * 100) : 0,
        })),
        bloodTypeDistribution: Object.entries(bloodTypeStats).map(([label, value]) => ({
          label,
          value,
          percentage: totalPatients > 0 ? Math.round((value / totalPatients) * 100) : 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating patients report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte de pacientes" },
      { status: 500 }
    );
  }
}
