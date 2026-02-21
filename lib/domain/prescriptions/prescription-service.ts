import { logAudit } from "@/lib/audit"
import { prescriptionRepository } from "./prescription-repository"
import type {
  PrescriptionListItem,
  PrescriptionDetail,
  PrescriptionFilters,
  PrescriptionListResult,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
} from "./types"

export class PatientNotFoundError extends Error {
  constructor() {
    super("Patient not found")
    this.name = "PatientNotFoundError"
  }
}

export class MedicalNoteNotFoundError extends Error {
  constructor() {
    super("Medical note not found")
    this.name = "MedicalNoteNotFoundError"
  }
}

export class PrescriptionAlreadyExistsError extends Error {
  constructor() {
    super("Prescription already exists for this note")
    this.name = "PrescriptionAlreadyExistsError"
  }
}

export class PrescriptionNotFoundError extends Error {
  constructor() {
    super("Prescription not found")
    this.name = "PrescriptionNotFoundError"
  }
}

export const prescriptionService = {
  async listByClinic(
    clinicId: bigint,
    filters: PrescriptionFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PrescriptionListResult> {
    return prescriptionRepository.findMany(clinicId, filters, page, limit)
  },

  async getById(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<PrescriptionDetail> {
    const prescription = await prescriptionRepository.findById(id, clinicId)
    if (!prescription) throw new PrescriptionNotFoundError()

    await logAudit(userId, {
      action: "READ",
      entityType: "Prescription",
      entityId: id.toString(),
      entityName: `Receta - ${prescription.patient.firstName} ${prescription.patient.lastName}`,
    })

    return prescription
  },

  async create(
    clinicId: bigint,
    doctorId: string,
    input: CreatePrescriptionInput,
    userId: string
  ): Promise<PrescriptionListItem> {
    const patientExists = await prescriptionRepository.findByPatientAndClinic(
      input.patientId,
      clinicId
    )
    if (!patientExists) throw new PatientNotFoundError()

    const noteExists = await prescriptionRepository.findMedicalNoteForPatient(
      input.medicalNoteId,
      input.patientId
    )
    if (!noteExists) throw new MedicalNoteNotFoundError()

    const existingPrescription = await prescriptionRepository.findByMedicalNoteId(
      input.medicalNoteId
    )
    if (existingPrescription) throw new PrescriptionAlreadyExistsError()

    const prescription = await prescriptionRepository.create(doctorId, input)

    await logAudit(userId, {
      action: "CREATE",
      entityType: "Prescription",
      entityId: prescription.id,
      entityName: `Receta - ${prescription.patient.firstName} ${prescription.patient.lastName}`,
    })

    return prescription
  },

  async update(
    id: bigint,
    clinicId: bigint,
    input: UpdatePrescriptionInput,
    userId: string
  ): Promise<PrescriptionListItem> {
    const existing = await prescriptionRepository.findById(id, clinicId)
    if (!existing) throw new PrescriptionNotFoundError()

    const prescription = await prescriptionRepository.update(id, input)

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "Prescription",
      entityId: prescription.id,
      entityName: `Receta - ${prescription.patient.firstName} ${prescription.patient.lastName}`,
    })

    return prescription
  },
}
