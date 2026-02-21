import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  patientService,
  PatientNotFoundError,
  DuplicateCurpError,
  PatientNotDeletedError,
} from "@/lib/domain/patients/patient-service"
import { patientRepository } from "@/lib/domain/patients/patient-repository"

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("@/lib/domain/patients/patient-repository", () => ({
  patientRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByIdIncludingDeleted: vi.fn(),
    findByCurp: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    getMedicalHistory: vi.fn(),
    upsertMedicalHistory: vi.fn(),
    getEmergencyContacts: vi.fn(),
    createEmergencyContact: vi.fn(),
    deleteEmergencyContact: vi.fn(),
    clearPrimaryEmergencyContacts: vi.fn(),
    findEmergencyContact: vi.fn(),
    getPatientNotes: vi.fn(),
  },
}))

describe("PatientService", () => {
  const mockClinicId = BigInt(1)
  const mockPatientId = BigInt(2)
  const mockUserId = "user-123"

  const mockPatientListItem = {
    id: "2",
    clinicId: "1",
    firstName: "Juan",
    lastName: "Perez",
    middleName: null,
    curp: "PEMJ900101HDFABC01",
    birthDate: new Date("1990-01-01"),
    gender: "MALE" as const,
    bloodType: null,
    email: "juan@example.com",
    phone: "5551234567",
    mobile: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    isActive: true,
    deletedAt: null,
    notes: null,
    photoUrl: null,
    photoName: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    medicalHistory: null,
  }

  const mockPatientDetail = {
    ...mockPatientListItem,
    emergencyContacts: [],
    _count: { appointments: 5, medicalNotes: 3 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listByClinic", () => {
    it("should return paginated patients", async () => {
      const mockResult = {
        data: [mockPatientListItem],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }
      vi.mocked(patientRepository.findMany).mockResolvedValue(mockResult)

      const result = await patientService.listByClinic(mockClinicId, {}, 1, 10)

      expect(result).toEqual(mockResult)
      expect(patientRepository.findMany).toHaveBeenCalledWith(mockClinicId, {}, 1, 10)
    })

    it("should pass filters correctly", async () => {
      const filters = { search: "juan" }
      vi.mocked(patientRepository.findMany).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      })

      await patientService.listByClinic(mockClinicId, filters, 1, 10)

      expect(patientRepository.findMany).toHaveBeenCalledWith(mockClinicId, filters, 1, 10)
    })
  })

  describe("getById", () => {
    it("should return patient and log audit", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)

      const result = await patientService.getById(mockPatientId, mockClinicId, mockUserId)

      expect(result).toEqual(mockPatientDetail)
    })

    it("should throw PatientNotFoundError if not found", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(null)

      await expect(
        patientService.getById(mockPatientId, mockClinicId, mockUserId)
      ).rejects.toThrow(PatientNotFoundError)
    })
  })

  describe("create", () => {
    it("should create patient without CURP", async () => {
      vi.mocked(patientRepository.create).mockResolvedValue(mockPatientListItem)

      const input = {
        firstName: "Juan",
        lastName: "Perez",
        birthDate: new Date("1990-01-01"),
        gender: "MALE" as const,
      }

      const result = await patientService.create(mockClinicId, input, mockUserId)

      expect(result).toEqual(mockPatientListItem)
      expect(patientRepository.findByCurp).not.toHaveBeenCalled()
    })

    it("should create patient with unique CURP", async () => {
      vi.mocked(patientRepository.findByCurp).mockResolvedValue(null)
      vi.mocked(patientRepository.create).mockResolvedValue(mockPatientListItem)

      const input = {
        firstName: "Juan",
        lastName: "Perez",
        curp: "PEMJ900101HDFABC01",
        birthDate: new Date("1990-01-01"),
        gender: "MALE" as const,
      }

      const result = await patientService.create(mockClinicId, input, mockUserId)

      expect(result).toEqual(mockPatientListItem)
      expect(patientRepository.findByCurp).toHaveBeenCalledWith(input.curp, mockClinicId)
    })

    it("should throw DuplicateCurpError if CURP exists", async () => {
      vi.mocked(patientRepository.findByCurp).mockResolvedValue({ id: BigInt(999) })

      const input = {
        firstName: "Juan",
        lastName: "Perez",
        curp: "PEMJ900101HDFABC01",
        birthDate: new Date("1990-01-01"),
        gender: "MALE" as const,
      }

      await expect(
        patientService.create(mockClinicId, input, mockUserId)
      ).rejects.toThrow(DuplicateCurpError)
    })
  })

  describe("update", () => {
    it("should update patient", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.update).mockResolvedValue(mockPatientListItem)

      const input = { email: "newemail@example.com" }

      const result = await patientService.update(mockPatientId, mockClinicId, input, mockUserId)

      expect(result).toEqual(mockPatientListItem)
    })

    it("should throw PatientNotFoundError if not found", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(null)

      await expect(
        patientService.update(mockPatientId, mockClinicId, {}, mockUserId)
      ).rejects.toThrow(PatientNotFoundError)
    })
  })

  describe("softDelete", () => {
    it("should soft delete patient", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)

      await patientService.softDelete(mockPatientId, mockClinicId, mockUserId)

      expect(patientRepository.softDelete).toHaveBeenCalledWith(mockPatientId)
    })

    it("should throw PatientNotFoundError if not found", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(null)

      await expect(
        patientService.softDelete(mockPatientId, mockClinicId, mockUserId)
      ).rejects.toThrow(PatientNotFoundError)
    })
  })

  describe("restore", () => {
    it("should restore deleted patient", async () => {
      const deletedPatient = { ...mockPatientDetail, deletedAt: new Date() }
      vi.mocked(patientRepository.findByIdIncludingDeleted).mockResolvedValue(deletedPatient)
      vi.mocked(patientRepository.restore).mockResolvedValue(mockPatientListItem)

      const result = await patientService.restore(mockPatientId, mockClinicId, mockUserId)

      expect(result).toEqual(mockPatientListItem)
      expect(patientRepository.restore).toHaveBeenCalledWith(mockPatientId)
    })

    it("should throw PatientNotDeletedError if patient not deleted", async () => {
      vi.mocked(patientRepository.findByIdIncludingDeleted).mockResolvedValue(mockPatientDetail)

      await expect(
        patientService.restore(mockPatientId, mockClinicId, mockUserId)
      ).rejects.toThrow(PatientNotDeletedError)
    })

    it("should throw PatientNotDeletedError if patient not found", async () => {
      vi.mocked(patientRepository.findByIdIncludingDeleted).mockResolvedValue(null)

      await expect(
        patientService.restore(mockPatientId, mockClinicId, mockUserId)
      ).rejects.toThrow(PatientNotDeletedError)
    })
  })

  describe("getMedicalHistory", () => {
    it("should return medical history", async () => {
      const mockHistory = {
        id: "1",
        patientId: "2",
        allergies: [],
        currentMedications: [],
        chronicDiseases: [],
        surgeries: [],
        familyHistory: null,
        personalHistory: null,
        smoking: false,
        alcohol: false,
        drugs: false,
        exercise: null,
        diet: null,
        vitalSigns: null,
        vitalSignsRecordedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.getMedicalHistory).mockResolvedValue(mockHistory)

      const result = await patientService.getMedicalHistory(mockPatientId, mockClinicId)

      expect(result).toEqual(mockHistory)
    })

    it("should throw PatientNotFoundError if patient not found", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(null)

      await expect(
        patientService.getMedicalHistory(mockPatientId, mockClinicId)
      ).rejects.toThrow(PatientNotFoundError)
    })
  })

  describe("upsertMedicalHistory", () => {
    it("should upsert medical history", async () => {
      const mockHistory = {
        id: "1",
        patientId: "2",
        allergies: ["Penicilina"],
        currentMedications: [],
        chronicDiseases: [],
        surgeries: [],
        familyHistory: null,
        personalHistory: null,
        smoking: false,
        alcohol: false,
        drugs: false,
        exercise: null,
        diet: null,
        vitalSigns: null,
        vitalSignsRecordedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.upsertMedicalHistory).mockResolvedValue(mockHistory)

      const input = { allergies: ["Penicilina"] }
      const result = await patientService.upsertMedicalHistory(mockPatientId, mockClinicId, input)

      expect(result).toEqual(mockHistory)
    })
  })

  describe("getEmergencyContacts", () => {
    it("should return emergency contacts", async () => {
      const mockContacts = [
        {
          id: "1",
          patientId: "2",
          name: "Maria Perez",
          relation: "Esposa",
          phone: "5559876543",
          email: null,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.getEmergencyContacts).mockResolvedValue(mockContacts)

      const result = await patientService.getEmergencyContacts(mockPatientId, mockClinicId)

      expect(result).toEqual(mockContacts)
    })
  })

  describe("createEmergencyContact", () => {
    it("should create emergency contact", async () => {
      const mockContact = {
        id: "1",
        patientId: "2",
        name: "Maria Perez",
        relation: "Esposa",
        phone: "5559876543",
        email: null,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.createEmergencyContact).mockResolvedValue(mockContact)

      const input = { name: "Maria Perez", relation: "Esposa", phone: "5559876543" }
      const result = await patientService.createEmergencyContact(mockPatientId, mockClinicId, input)

      expect(result).toEqual(mockContact)
      expect(patientRepository.clearPrimaryEmergencyContacts).not.toHaveBeenCalled()
    })

    it("should clear primary contacts when creating new primary", async () => {
      const mockContact = {
        id: "1",
        patientId: "2",
        name: "Maria Perez",
        relation: "Esposa",
        phone: "5559876543",
        email: null,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.createEmergencyContact).mockResolvedValue(mockContact)

      const input = { name: "Maria Perez", relation: "Esposa", phone: "5559876543", isPrimary: true }
      await patientService.createEmergencyContact(mockPatientId, mockClinicId, input)

      expect(patientRepository.clearPrimaryEmergencyContacts).toHaveBeenCalledWith(mockPatientId)
    })
  })

  describe("deleteEmergencyContact", () => {
    it("should delete emergency contact", async () => {
      const mockContact = {
        id: "1",
        patientId: "2",
        name: "Maria Perez",
        relation: "Esposa",
        phone: "5559876543",
        email: null,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.findEmergencyContact).mockResolvedValue(mockContact)

      await patientService.deleteEmergencyContact(mockPatientId, BigInt(1), mockClinicId)

      expect(patientRepository.deleteEmergencyContact).toHaveBeenCalledWith(BigInt(1))
    })

    it("should throw if contact not found", async () => {
      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.findEmergencyContact).mockResolvedValue(null)

      await expect(
        patientService.deleteEmergencyContact(mockPatientId, BigInt(999), mockClinicId)
      ).rejects.toThrow("Contact not found")
    })
  })

  describe("getPatientNotes", () => {
    it("should return patient notes", async () => {
      const mockNotes = [
        {
          id: "1",
          clinicId: "1",
          patientId: "2",
          doctorId: "doc-1",
          appointmentId: null,
          specialty: "GENERAL",
          type: "CONSULTATION",
          chiefComplaint: "Dolor de cabeza",
          currentIllness: null,
          vitalSigns: null,
          physicalExam: null,
          diagnosis: "Migraña",
          prognosis: null,
          treatment: "Analgésicos",
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          doctor: { id: "doc-1", name: "Dr. Smith", specialty: "GENERAL" },
        },
      ]

      vi.mocked(patientRepository.findById).mockResolvedValue(mockPatientDetail)
      vi.mocked(patientRepository.getPatientNotes).mockResolvedValue(mockNotes)

      const result = await patientService.getPatientNotes(mockPatientId, mockClinicId)

      expect(result).toEqual(mockNotes)
    })
  })
})
