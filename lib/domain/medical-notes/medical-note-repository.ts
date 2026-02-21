import { prisma } from "@/lib/prisma"
import type { Specialty, noteTypeEnum } from "@/lib/validations/medical-note"
import type {
  MedicalNoteRepository,
  MedicalNoteListItem,
  MedicalNoteDetail,
  MedicalNoteFilters,
  MedicalNoteListResult,
  CreateMedicalNoteInput,
  UpdateMedicalNoteInput,
  VitalSigns,
  NoteType,
} from "./types"

type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

function mapVitalSigns(vitalSigns: unknown): Record<string, unknown> | null {
  if (!vitalSigns) return null
  if (typeof vitalSigns === "string") {
    try {
      return JSON.parse(vitalSigns)
    } catch {
      return null
    }
  }
  return vitalSigns as Record<string, unknown>
}

interface PrismaMedicalNoteList {
  id: bigint
  clinicId: bigint
  patientId: bigint
  doctorId: string
  appointmentId: bigint | null
  specialty: string | null
  type: string | null
  chiefComplaint: string | null
  diagnosis: string | null
  createdAt: Date
  updatedAt: Date
  patient: { id: bigint; firstName: string; lastName: string; middleName: string | null }
  doctor: { id: string; name: string; specialty: string | null }
}

interface PrismaMedicalNoteDetail extends PrismaMedicalNoteList {
  currentIllness: string | null
  vitalSigns: unknown
  physicalExam: string | null
  prognosis: string | null
  treatment: string | null
  notes: string | null
  doctor: { id: string; name: string; email: string; specialty: string | null; licenseNumber: string | null }
  appointment: { id: bigint; clinicId: bigint; patientId: bigint; doctorId: string; startTime: Date; endTime: Date; status: string; reason: string | null; notes: string | null } | null
  prescriptions: Array<{ id: bigint; patientId: bigint; doctorId: string; medicalNoteId: bigint; medications: unknown; instructions: string | null; issueDate: Date; validUntil: Date | null; createdAt: Date }>
}

function mapNoteToListItem(note: PrismaMedicalNoteList): MedicalNoteListItem {
  return {
    id: note.id.toString(),
    clinicId: note.clinicId.toString(),
    patientId: note.patientId.toString(),
    doctorId: note.doctorId,
    appointmentId: note.appointmentId?.toString() ?? null,
    specialty: note.specialty as Specialty,
    type: note.type as NoteType,
    chiefComplaint: note.chiefComplaint ?? "",
    diagnosis: note.diagnosis ?? "",
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    patient: {
      id: note.patient.id.toString(),
      firstName: note.patient.firstName,
      lastName: note.patient.lastName,
      middleName: note.patient.middleName,
    },
    doctor: {
      id: note.doctor.id,
      name: note.doctor.name,
      specialty: note.doctor.specialty ?? "",
    },
  }
}

function mapNoteToDetail(note: PrismaMedicalNoteDetail): MedicalNoteDetail {
  return {
    id: note.id.toString(),
    clinicId: note.clinicId.toString(),
    patientId: note.patientId.toString(),
    doctorId: note.doctorId,
    appointmentId: note.appointmentId?.toString() ?? null,
    specialty: note.specialty as Specialty,
    type: note.type as NoteType,
    chiefComplaint: note.chiefComplaint ?? "",
    currentIllness: note.currentIllness,
    vitalSigns: mapVitalSigns(note.vitalSigns) as VitalSigns | null,
    physicalExam: note.physicalExam,
    diagnosis: note.diagnosis ?? "",
    prognosis: note.prognosis,
    treatment: note.treatment,
    notes: note.notes,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    patient: {
      id: note.patient.id.toString(),
      firstName: note.patient.firstName,
      lastName: note.patient.lastName,
      middleName: note.patient.middleName,
    },
    doctor: {
      id: note.doctor.id,
      name: note.doctor.name,
      email: note.doctor.email,
      specialty: note.doctor.specialty ?? "",
      licenseNumber: note.doctor.licenseNumber,
    },
    appointment: note.appointment
      ? {
          id: note.appointment.id.toString(),
          clinicId: note.appointment.clinicId.toString(),
          patientId: note.appointment.patientId.toString(),
          doctorId: note.appointment.doctorId,
          startTime: note.appointment.startTime,
          endTime: note.appointment.endTime,
          status: note.appointment.status,
          reason: note.appointment.reason,
          notes: note.appointment.notes,
        }
      : null,
    prescriptions: note.prescriptions.map((p) => ({
      id: p.id.toString(),
      patientId: p.patientId.toString(),
      doctorId: p.doctorId,
      medicalNoteId: p.medicalNoteId.toString(),
      medications: p.medications,
      instructions: p.instructions,
      issueDate: p.issueDate,
      validUntil: p.validUntil,
      createdAt: p.createdAt,
    })),
  }
}

export const medicalNoteRepository: MedicalNoteRepository = {
  async findByClinic(clinicId, filters, page, limit) {
    const where: Record<string, unknown> = { clinicId }

    if (filters.patientId) where.patientId = BigInt(filters.patientId)
    if (filters.doctorId) where.doctorId = filters.doctorId
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) (where.createdAt as Record<string, Date>).gte = filters.startDate
      if (filters.endDate) (where.createdAt as Record<string, Date>).lte = filters.endDate
    }
    if (filters.search) {
      where.OR = [
        { patient: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { patient: { lastName: { contains: filters.search, mode: "insensitive" } } },
        { diagnosis: { contains: filters.search, mode: "insensitive" } },
        { chiefComplaint: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const [notes, total] = await Promise.all([
      prisma.medicalNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
            },
          },
        },
      }),
      prisma.medicalNote.count({ where }),
    ])

    return {
      data: notes.map(mapNoteToListItem),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  },

  async findById(id, clinicId) {
    const note = await prisma.medicalNote.findFirst({
      where: { id, clinicId },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            licenseNumber: true,
          },
        },
        prescriptions: true,
        appointment: true,
      },
    })

    if (!note) return null
    return mapNoteToDetail(note)
  },

  async findByAppointmentId(appointmentId) {
    const note = await prisma.medicalNote.findFirst({
      where: { appointmentId },
      select: { id: true },
    })
    return note
  },

  async create(clinicId, doctorId, data) {
    const note = await prisma.medicalNote.create({
      data: {
        clinicId,
        doctorId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        specialty: data.specialty,
        type: data.type,
        chiefComplaint: data.chiefComplaint,
        currentIllness: data.currentIllness,
        vitalSigns: data.vitalSigns ? JSON.stringify(data.vitalSigns) : undefined,
        physicalExam: data.physicalExam,
        diagnosis: data.diagnosis,
        prognosis: data.prognosis,
        treatment: data.treatment,
        notes: data.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    })

    return mapNoteToListItem(note)
  },

  async update(id, data) {
    const updateData: Record<string, unknown> = {}
    if (data.specialty !== undefined) updateData.specialty = data.specialty
    if (data.type !== undefined) updateData.type = data.type
    if (data.chiefComplaint !== undefined) updateData.chiefComplaint = data.chiefComplaint
    if (data.currentIllness !== undefined) updateData.currentIllness = data.currentIllness
    if (data.vitalSigns !== undefined) updateData.vitalSigns = JSON.stringify(data.vitalSigns)
    if (data.physicalExam !== undefined) updateData.physicalExam = data.physicalExam
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis
    if (data.prognosis !== undefined) updateData.prognosis = data.prognosis
    if (data.treatment !== undefined) updateData.treatment = data.treatment
    if (data.notes !== undefined) updateData.notes = data.notes

    const note = await prisma.medicalNote.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    })

    return mapNoteToListItem(note)
  },

  async updateAppointmentStatus(appointmentId, status) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: status as AppointmentStatus },
    })
  },
}
