import { prisma } from "@/lib/prisma"
import type {
  PrescriptionListItem,
  PrescriptionDetail,
  PrescriptionFilters,
  PrescriptionListResult,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  Medication,
} from "./types"

function mapPrescriptionToListItem(prescription: any): PrescriptionListItem {
  return {
    id: prescription.id.toString(),
    patientId: prescription.patientId.toString(),
    doctorId: prescription.doctorId,
    medicalNoteId: prescription.medicalNoteId.toString(),
    medications: prescription.medications as Medication[],
    instructions: prescription.instructions,
    issueDate: prescription.issueDate,
    validUntil: prescription.validUntil,
    digitalSignature: prescription.digitalSignature,
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt,
    patient: {
      id: prescription.patient.id.toString(),
      firstName: prescription.patient.firstName,
      lastName: prescription.patient.lastName,
      middleName: prescription.patient.middleName,
      curp: prescription.patient.curp,
    },
    doctor: {
      id: prescription.doctor.id,
      name: prescription.doctor.name,
      specialty: prescription.doctor.specialty,
      licenseNumber: prescription.doctor.licenseNumber,
    },
    medicalNote: {
      id: prescription.medicalNote.id.toString(),
      createdAt: prescription.medicalNote.createdAt,
    },
  }
}

export const prescriptionRepository = {
  async findMany(
    clinicId: bigint,
    filters: PrescriptionFilters,
    page: number,
    limit: number
  ): Promise<PrescriptionListResult> {
    const where: Record<string, unknown> = {
      patient: { clinicId },
    }

    if (filters.patientId) where.patientId = BigInt(filters.patientId)
    if (filters.doctorId) where.doctorId = filters.doctorId

    if (filters.search) {
      where.OR = [
        { patient: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { patient: { lastName: { contains: filters.search, mode: "insensitive" } } },
        { patient: { curp: { contains: filters.search, mode: "insensitive" } } },
      ]
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              curp: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
              licenseNumber: true,
            },
          },
          medicalNote: {
            select: {
              id: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prescription.count({ where }),
    ])

    return {
      data: prescriptions.map(mapPrescriptionToListItem),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  },

  async findById(id: bigint, clinicId: bigint): Promise<PrescriptionDetail | null> {
    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        patient: { clinicId },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
          },
        },
        medicalNote: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })

    if (!prescription) return null
    return mapPrescriptionToListItem(prescription)
  },

  async findByMedicalNoteId(medicalNoteId: bigint): Promise<{ id: bigint } | null> {
    const prescription = await prisma.prescription.findFirst({
      where: { medicalNoteId },
      select: { id: true },
    })
    return prescription
  },

  async create(
    doctorId: string,
    data: CreatePrescriptionInput
  ): Promise<PrescriptionListItem> {
    const prescription = await prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId,
        medicalNoteId: data.medicalNoteId,
        medications: data.medications as any,
        instructions: data.instructions,
        validUntil: data.validUntil,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
          },
        },
        medicalNote: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })

    return mapPrescriptionToListItem(prescription)
  },

  async update(id: bigint, data: UpdatePrescriptionInput): Promise<PrescriptionListItem> {
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        medications: data.medications as any,
        instructions: data.instructions,
        validUntil: data.validUntil,
        digitalSignature: data.digitalSignature,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
          },
        },
        medicalNote: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })

    return mapPrescriptionToListItem(prescription)
  },

  async findByPatientAndClinic(
    patientId: bigint,
    clinicId: bigint
  ): Promise<boolean> {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId, deletedAt: null },
      select: { id: true },
    })
    return !!patient
  },

  async findMedicalNoteForPatient(
    medicalNoteId: bigint,
    patientId: bigint
  ): Promise<boolean> {
    const note = await prisma.medicalNote.findFirst({
      where: { id: medicalNoteId, patientId },
      select: { id: true },
    })
    return !!note
  },
}
