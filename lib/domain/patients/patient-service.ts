import { logAudit } from "@/lib/audit"
import { patientRepository } from "./patient-repository"
import type {
  PatientListItem,
  PatientDetail,
  PatientFilters,
  PatientListResult,
  CreatePatientInput,
  UpdatePatientInput,
  MedicalHistory,
  EmergencyContact,
  UpdateMedicalHistoryInput,
  CreateEmergencyContactInput,
  PatientNoteSimple,
} from "./types"

export class PatientNotFoundError extends Error {
  constructor(message: string = "Patient not found") {
    super(message)
    this.name = "PatientNotFoundError"
  }
}

export class DuplicateCurpError extends Error {
  constructor(public curp: string) {
    super(`CURP ${curp} ya registrada`)
    this.name = "DuplicateCurpError"
  }
}

export class PatientNotDeletedError extends Error {
  constructor() {
    super("Patient not found or not deleted")
    this.name = "PatientNotDeletedError"
  }
}

export const patientService = {
  async listByClinic(
    clinicId: bigint,
    filters: PatientFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PatientListResult> {
    return patientRepository.findMany(clinicId, filters, page, limit)
  },

  async getById(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<PatientDetail> {
    const patient = await patientRepository.findById(id, clinicId)
    if (!patient) throw new PatientNotFoundError()

    await logAudit(userId, {
      action: "READ",
      entityType: "Patient",
      entityId: id.toString(),
      entityName: `${patient.firstName} ${patient.lastName}`,
    })

    return patient
  },

  async create(
    clinicId: bigint,
    data: CreatePatientInput,
    userId: string
  ): Promise<PatientListItem> {
    if (data.curp) {
      const existing = await patientRepository.findByCurp(data.curp, clinicId)
      if (existing) throw new DuplicateCurpError(data.curp)
    }

    const patient = await patientRepository.create(clinicId, data)

    await logAudit(userId, {
      action: "CREATE",
      entityType: "Patient",
      entityId: patient.id,
      entityName: `${patient.firstName} ${patient.lastName}`,
    })

    return patient
  },

  async update(
    id: bigint,
    clinicId: bigint,
    data: UpdatePatientInput,
    userId: string
  ): Promise<PatientListItem> {
    const existing = await patientRepository.findById(id, clinicId)
    if (!existing) throw new PatientNotFoundError()

    const patient = await patientRepository.update(id, data)

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "Patient",
      entityId: patient.id,
      entityName: `${patient.firstName} ${patient.lastName}`,
    })

    return patient
  },

  async softDelete(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<void> {
    const patient = await patientRepository.findById(id, clinicId)
    if (!patient) throw new PatientNotFoundError()

    await patientRepository.softDelete(id)

    await logAudit(userId, {
      action: "DELETE",
      entityType: "Patient",
      entityId: id.toString(),
      entityName: `${patient.firstName} ${patient.lastName}`,
    })
  },

  async restore(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<PatientListItem> {
    const patient = await patientRepository.findByIdIncludingDeleted(id, clinicId)
    if (!patient || !patient.deletedAt) throw new PatientNotDeletedError()

    const restored = await patientRepository.restore(id)

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "Patient",
      entityId: id.toString(),
      entityName: `${restored.firstName} ${restored.lastName}`,
    })

    return restored
  },

  async getMedicalHistory(patientId: bigint, clinicId: bigint): Promise<MedicalHistory | null> {
    const patient = await patientRepository.findById(patientId, clinicId)
    if (!patient) throw new PatientNotFoundError()

    return patientRepository.getMedicalHistory(patientId)
  },

  async upsertMedicalHistory(
    patientId: bigint,
    clinicId: bigint,
    data: UpdateMedicalHistoryInput
  ): Promise<MedicalHistory> {
    const patient = await patientRepository.findById(patientId, clinicId)
    if (!patient) throw new PatientNotFoundError()

    return patientRepository.upsertMedicalHistory(patientId, data)
  },

  async getEmergencyContacts(
    patientId: bigint,
    clinicId: bigint
  ): Promise<EmergencyContact[]> {
    const patient = await patientRepository.findById(patientId, clinicId)
    if (!patient) throw new PatientNotFoundError()

    return patientRepository.getEmergencyContacts(patientId)
  },

  async createEmergencyContact(
    patientId: bigint,
    clinicId: bigint,
    data: CreateEmergencyContactInput
  ): Promise<EmergencyContact> {
    const patient = await patientRepository.findById(patientId, clinicId)
    if (!patient) throw new PatientNotFoundError()

    if (data.isPrimary) {
      await patientRepository.clearPrimaryEmergencyContacts(patientId)
    }

    return patientRepository.createEmergencyContact(patientId, data)
  },

  async deleteEmergencyContact(
    patientId: bigint,
    contactId: bigint,
    clinicId: bigint
  ): Promise<void> {
    const patient = await patientRepository.findById(patientId, clinicId)
    if (!patient) throw new PatientNotFoundError()

    const contact = await patientRepository.findEmergencyContact(contactId, patientId)
    if (!contact) throw new Error("Contact not found")

    await patientRepository.deleteEmergencyContact(contactId)
  },

  async getPatientNotes(patientId: bigint, clinicId: bigint): Promise<PatientNoteSimple[]> {
    const patient = await patientRepository.findById(patientId, clinicId)
    if (!patient) throw new PatientNotFoundError()

    return patientRepository.getPatientNotes(patientId, clinicId)
  },
}
