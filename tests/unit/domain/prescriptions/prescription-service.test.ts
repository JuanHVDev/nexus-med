import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  prescriptionService,
  PatientNotFoundError,
  MedicalNoteNotFoundError,
  PrescriptionAlreadyExistsError,
  PrescriptionNotFoundError,
} from "@/lib/domain/prescriptions/prescription-service"
import { prescriptionRepository } from "@/lib/domain/prescriptions/prescription-repository"

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("@/lib/domain/prescriptions/prescription-repository", () => ({
  prescriptionRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByMedicalNoteId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findByPatientAndClinic: vi.fn(),
    findMedicalNoteForPatient: vi.fn(),
  },
}))

describe("PrescriptionService", () => {
  const mockClinicId = BigInt(1)
  const mockPatientId = BigInt(2)
  const mockMedicalNoteId = BigInt(3)
  const mockDoctorId = "doctor-123"
  const mockUserId = "user-123"

  const mockMedications = [
    {
      name: "Paracetamol",
      dosage: "500mg",
      route: "Oral",
      frequency: "Cada 8 horas",
      duration: "7 días",
      instructions: "Tomar con alimentos",
    },
  ]

  const mockPrescriptionListItem = {
    id: "1",
    patientId: "2",
    doctorId: mockDoctorId,
    medicalNoteId: "3",
    medications: mockMedications,
    instructions: "Tomar completo el tratamiento",
    issueDate: new Date(),
    validUntil: null,
    digitalSignature: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: "2",
      firstName: "Juan",
      lastName: "Perez",
      middleName: null,
      curp: "PEMJ900101HDFABC01",
    },
    doctor: {
      id: mockDoctorId,
      name: "Dr. Smith",
      specialty: "GENERAL",
      licenseNumber: "12345",
    },
    medicalNote: {
      id: "3",
      createdAt: new Date(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listByClinic", () => {
    it("should return paginated prescriptions", async () => {
      const mockResult = {
        data: [mockPrescriptionListItem],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }
      vi.mocked(prescriptionRepository.findMany).mockResolvedValue(mockResult)

      const result = await prescriptionService.listByClinic(mockClinicId, {}, 1, 10)

      expect(result).toEqual(mockResult)
      expect(prescriptionRepository.findMany).toHaveBeenCalledWith(mockClinicId, {}, 1, 10)
    })

    it("should pass filters correctly", async () => {
      const filters = { patientId: "2", search: "juan" }
      vi.mocked(prescriptionRepository.findMany).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      })

      await prescriptionService.listByClinic(mockClinicId, filters, 1, 10)

      expect(prescriptionRepository.findMany).toHaveBeenCalledWith(mockClinicId, filters, 1, 10)
    })
  })

  describe("getById", () => {
    it("should return prescription and log audit", async () => {
      vi.mocked(prescriptionRepository.findById).mockResolvedValue(mockPrescriptionListItem)

      const result = await prescriptionService.getById(BigInt(1), mockClinicId, mockUserId)

      expect(result).toEqual(mockPrescriptionListItem)
    })

    it("should throw PrescriptionNotFoundError if not found", async () => {
      vi.mocked(prescriptionRepository.findById).mockResolvedValue(null)

      await expect(
        prescriptionService.getById(BigInt(999), mockClinicId, mockUserId)
      ).rejects.toThrow(PrescriptionNotFoundError)
    })
  })

  describe("create", () => {
    it("should create prescription successfully", async () => {
      vi.mocked(prescriptionRepository.findByPatientAndClinic).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findMedicalNoteForPatient).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findByMedicalNoteId).mockResolvedValue(null)
      vi.mocked(prescriptionRepository.create).mockResolvedValue(mockPrescriptionListItem)

      const input = {
        patientId: mockPatientId,
        medicalNoteId: mockMedicalNoteId,
        medications: mockMedications,
        instructions: "Tomar completo",
      }

      const result = await prescriptionService.create(
        mockClinicId,
        mockDoctorId,
        input,
        mockUserId
      )

      expect(result).toEqual(mockPrescriptionListItem)
      expect(prescriptionRepository.create).toHaveBeenCalledWith(
        mockDoctorId,
        input
      )
    })

    it("should throw PatientNotFoundError if patient not in clinic", async () => {
      vi.mocked(prescriptionRepository.findByPatientAndClinic).mockResolvedValue(false)

      const input = {
        patientId: mockPatientId,
        medicalNoteId: mockMedicalNoteId,
        medications: mockMedications,
      }

      await expect(
        prescriptionService.create(mockClinicId, mockDoctorId, input, mockUserId)
      ).rejects.toThrow(PatientNotFoundError)
    })

    it("should throw MedicalNoteNotFoundError if note not for patient", async () => {
      vi.mocked(prescriptionRepository.findByPatientAndClinic).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findMedicalNoteForPatient).mockResolvedValue(false)

      const input = {
        patientId: mockPatientId,
        medicalNoteId: mockMedicalNoteId,
        medications: mockMedications,
      }

      await expect(
        prescriptionService.create(mockClinicId, mockDoctorId, input, mockUserId)
      ).rejects.toThrow(MedicalNoteNotFoundError)
    })

    it("should throw PrescriptionAlreadyExistsError if prescription exists for note", async () => {
      vi.mocked(prescriptionRepository.findByPatientAndClinic).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findMedicalNoteForPatient).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findByMedicalNoteId).mockResolvedValue({ id: BigInt(99) })

      const input = {
        patientId: mockPatientId,
        medicalNoteId: mockMedicalNoteId,
        medications: mockMedications,
      }

      await expect(
        prescriptionService.create(mockClinicId, mockDoctorId, input, mockUserId)
      ).rejects.toThrow(PrescriptionAlreadyExistsError)
    })

    it("should create with validUntil date", async () => {
      vi.mocked(prescriptionRepository.findByPatientAndClinic).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findMedicalNoteForPatient).mockResolvedValue(true)
      vi.mocked(prescriptionRepository.findByMedicalNoteId).mockResolvedValue(null)
      vi.mocked(prescriptionRepository.create).mockResolvedValue(mockPrescriptionListItem)

      const validUntil = new Date("2025-12-31")
      const input = {
        patientId: mockPatientId,
        medicalNoteId: mockMedicalNoteId,
        medications: mockMedications,
        validUntil,
      }

      await prescriptionService.create(mockClinicId, mockDoctorId, input, mockUserId)

      expect(prescriptionRepository.create).toHaveBeenCalledWith(
        mockDoctorId,
        expect.objectContaining({ validUntil })
      )
    })
  })

  describe("update", () => {
    it("should update prescription", async () => {
      vi.mocked(prescriptionRepository.findById).mockResolvedValue(mockPrescriptionListItem)
      vi.mocked(prescriptionRepository.update).mockResolvedValue(mockPrescriptionListItem)

      const input = {
        instructions: "Nuevas instrucciones",
      }

      const result = await prescriptionService.update(
        BigInt(1),
        mockClinicId,
        input,
        mockUserId
      )

      expect(result).toEqual(mockPrescriptionListItem)
    })

    it("should throw PrescriptionNotFoundError if not found", async () => {
      vi.mocked(prescriptionRepository.findById).mockResolvedValue(null)

      await expect(
        prescriptionService.update(BigInt(999), mockClinicId, {}, mockUserId)
      ).rejects.toThrow(PrescriptionNotFoundError)
    })

    it("should update medications", async () => {
      vi.mocked(prescriptionRepository.findById).mockResolvedValue(mockPrescriptionListItem)
      vi.mocked(prescriptionRepository.update).mockResolvedValue(mockPrescriptionListItem)

      const newMedications = [
        {
          name: "Ibuprofeno",
          dosage: "400mg",
          route: "Oral",
          frequency: "Cada 12 horas",
        },
      ]

      await prescriptionService.update(
        BigInt(1),
        mockClinicId,
        { medications: newMedications },
        mockUserId
      )

      expect(prescriptionRepository.update).toHaveBeenCalledWith(
        BigInt(1),
        expect.objectContaining({ medications: newMedications })
      )
    })

    it("should update digitalSignature", async () => {
      vi.mocked(prescriptionRepository.findById).mockResolvedValue(mockPrescriptionListItem)
      vi.mocked(prescriptionRepository.update).mockResolvedValue(mockPrescriptionListItem)

      await prescriptionService.update(
        BigInt(1),
        mockClinicId,
        { digitalSignature: "signed-data" },
        mockUserId
      )

      expect(prescriptionRepository.update).toHaveBeenCalledWith(
        BigInt(1),
        expect.objectContaining({ digitalSignature: "signed-data" })
      )
    })
  })
})
