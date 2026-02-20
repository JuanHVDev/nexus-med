import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserClinicId } from "@/lib/clinic";
import { UserRole } from "@/generated/prisma/client";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clinicId = await getUserClinicId(session.user.id);
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic assigned" }, { status: 403 });
    }

    // Obtener usuarios con rol DOCTOR o ADMIN en esta clínica
    // ADMIN tiene permisos completos incluyendo atender pacientes
    const userClinics = await prisma.userClinic.findMany({
      where: {
        clinicId,
        role: { in: [UserRole.DOCTOR, UserRole.ADMIN] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
            isActive: true,
          },
        },
      },
    });

    const doctors = userClinics
      .filter(uc => uc.user.isActive)
      .map(uc => ({
        id: uc.user.id,
        name: uc.user.name,
        specialty: uc.user.specialty || "General",
        licenseNumber: uc.user.licenseNumber,
      }));

    const response = NextResponse.json({ doctors });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Error al obtener médicos" },
      { status: 500 }
    );
  }
}
