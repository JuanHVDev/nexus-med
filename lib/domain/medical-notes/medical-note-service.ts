import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { medicalNoteRepository } from "./medical-note-repository"
import type {
  MedicalNoteListItem,
  MedicalNoteDetail,
  MedicalNoteFilters,
  MedicalNoteListResult,
  CreateMedicalNoteInput,
  UpdateMedicalNoteInput,
} from "./types"

export const ALLOWED_ROLES = ["ADMIN", "DOCTOR"] as const

function parseVitalSignsInput(vitalSigns: unknown): Record<string, unknown> | undefined {
  if (!vitalSigns) return undefined
  if (typeof vitalSigns === "string") {
    try {
      return JSON.parse(vitalSigns)
    } catch {
      return undefined
    }
  }
  return vitalSigns as Record<string, unknown>
}

export const medicalNoteService = {
  async listByClinic(
    clinicId: bigint,
    filters: MedicalNoteFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<MedicalNoteListResult> {
    return medicalNoteRepository.findByClinic(clinicId, filters, page, limit)
  },

  async getById(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<MedicalNoteDetail | null> {
    const note = await medicalNoteRepository.findById(id, clinicId)
    if (!note) return null

    await logAudit(userId, {
      action: "READ",
      entityType: "MedicalNote",
      entityId: id.toString(),
      entityName: `Nota medica - ${note.patient.firstName} ${note.patient.lastName}`,
    })

    return note
  },

  async create(
    clinicId: bigint,
    doctorId: string,
    data: CreateMedicalNoteInput,
    userId: string
  ): Promise<MedicalNoteListItem> {
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        clinicId,
        deletedAt: null,
      },
    })

    if (!patient) {
      throw new Error("Paciente no encontrado")
    }

    if (data.appointmentId) {
      const existingNote = await medicalNoteRepository.findByAppointmentId(data.appointmentId)

      if (existingNote) {
        const updateData: UpdateMedicalNoteInput = {
          specialty: data.specialty,
          type: data.type,
          chiefComplaint: data.chiefComplaint,
          currentIllness: data.currentIllness,
          vitalSigns: data.vitalSigns,
          physicalExam: data.physicalExam,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
          treatment: data.treatment,
          notes: data.notes,
        }

        const updatedNote = await medicalNoteRepository.update(existingNote.id, updateData)

        await medicalNoteRepository.updateAppointmentStatus(data.appointmentId, "COMPLETED")

        return updatedNote
      }
    }

    const note = await medicalNoteRepository.create(clinicId, doctorId, data)

    if (data.appointmentId) {
      await medicalNoteRepository.updateAppointmentStatus(data.appointmentId, "IN_PROGRESS")
    }

    return note
  },

  async update(
    id: bigint,
    clinicId: bigint,
    data: UpdateMedicalNoteInput,
    userId: string
  ): Promise<MedicalNoteListItem> {
    const existingNote = await medicalNoteRepository.findById(id, clinicId)
    if (!existingNote) {
      throw new Error("Nota medica no encontrada")
    }

    const processedData = {
      ...data,
      vitalSigns: data.vitalSigns ? parseVitalSignsInput(data.vitalSigns) : undefined,
    }

    const note = await medicalNoteRepository.update(id, processedData)

    if (existingNote.appointmentId) {
      await medicalNoteRepository.updateAppointmentStatus(
        BigInt(existingNote.appointmentId),
        "COMPLETED"
      )
    }

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "MedicalNote",
      entityId: id.toString(),
      entityName: `Nota medica - ${note.patient.firstName} ${note.patient.lastName}`,
    })

    return note
  },
}
