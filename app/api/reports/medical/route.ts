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
    const specialty = searchParams.get("specialty");

    const where: Prisma.MedicalNoteWhereInput = {
      clinicId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
    }

    if (doctorId && doctorId !== "all") {
      where.doctorId = doctorId;
    }

    if (specialty && specialty !== "all") {
      where.specialty = specialty;
    }

    const medicalNotes = await prisma.medicalNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
            licenseNumber: true,
          },
        },
        prescriptions: {
          select: {
            id: true,
          },
        },
        labOrders: {
          select: {
            id: true,
          },
        },
        imagingOrders: {
          select: {
            id: true,
          },
        },
      },
    });

    const totalConsultations = medicalNotes.length;
    
    const specialtyStats = medicalNotes.reduce((acc, note) => {
      const spec = note.specialty || "General";
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const doctorStats = medicalNotes.reduce((acc, note) => {
      const doctorName = note.doctor.name;
      acc[doctorName] = (acc[doctorName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const diagnosisStats: Record<string, number> = {};
    medicalNotes.forEach((note) => {
      if (note.diagnosis) {
        const diagnoses = note.diagnosis.split(/[,\n]+/).map(d => d.trim()).filter(d => d);
        diagnoses.forEach((diag) => {
          diagnosisStats[diag] = (diagnosisStats[diag] || 0) + 1;
        });
      }
    });

    const dailyStats = medicalNotes.reduce((acc, note) => {
      const dateKey = format(note.createdAt, "yyyy-MM-dd");
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPrescriptions = medicalNotes.reduce((sum, note) => sum + note.prescriptions.length, 0);
    const totalLabOrders = medicalNotes.reduce((sum, note) => sum + note.labOrders.length, 0);
    const totalImagingOrders = medicalNotes.reduce((sum, note) => sum + note.imagingOrders.length, 0);

    const formattedNotes = medicalNotes.map((note) => ({
      id: note.id.toString(),
      createdAt: note.createdAt.toISOString(),
      dateFormatted: format(note.createdAt, "dd/MM/yyyy", { locale: es }),
      timeFormatted: format(note.createdAt, "HH:mm", { locale: es }),
      patientName: `${note.patient.firstName} ${note.patient.middleName ? note.patient.middleName + " " : ""}${note.patient.lastName}`,
      doctorName: note.doctor.name,
      specialty: note.specialty || "General",
      licenseNumber: note.doctor.licenseNumber,
      chiefComplaint: note.chiefComplaint,
      diagnosis: note.diagnosis,
      treatment: note.treatment,
      hasPrescriptions: note.prescriptions.length > 0,
      prescriptionsCount: note.prescriptions.length,
      hasLabOrders: note.labOrders.length > 0,
      labOrdersCount: note.labOrders.length,
      hasImagingOrders: note.imagingOrders.length > 0,
      imagingOrdersCount: note.imagingOrders.length,
    }));

    return NextResponse.json({
      consultations: formattedNotes,
      summary: {
        totalConsultations,
        totalPrescriptions,
        totalLabOrders,
        totalImagingOrders,
        specialtyDistribution: Object.entries(specialtyStats)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        doctorDistribution: Object.entries(doctorStats)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        topDiagnoses: Object.entries(diagnosisStats)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
        dailyDistribution: Object.entries(dailyStats)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    console.error("Error generating medical report:", error);
    return NextResponse.json(
      { error: "Error al generar reporte médico" },
      { status: 500 }
    );
  }
}
