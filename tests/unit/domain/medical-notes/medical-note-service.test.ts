import { describe, it, expect, vi, beforeEach } from "vitest"
import { medicalNoteService } from "@/lib/domain/medical-notes/medical-note-service"
import { medicalNoteRepository } from "@/lib/domain/medical-notes/medical-note-repository"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    patient: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("@/lib/domain/medical-notes/medical-note-repository", () => ({
  medicalNoteRepository: {
    findByClinic: vi.fn(),
    findById: vi.fn(),
    findByAppointmentId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateAppointmentStatus: vi.fn(),
  },
}))

describe("MedicalNoteService", () => {
  const mockClinicId = BigInt(1)
  const mockPatientId = BigInt(2)
  const mockAppointmentId = BigInt(3)
  const mockDoctorId = "doctor-123"
  const mockUserId = "user-123"

  const mockPatient = {
    id: mockPatientId,
    clinicId: mockClinicId,
    firstName: "Juan",
    lastName: "Perez",
    middleName: null,
    deletedAt: null,
  }

  const mockNoteListItem = {
    id: "1",
    clinicId: "1",
    patientId: "2",
    doctorId: mockDoctorId,
    appointmentId: null,
    specialty: "GENERAL",
    type: "CONSULTATION",
    chiefComplaint: "Dolor de cabeza",
    diagnosis: "Migraña",
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: "2",
      firstName: "Juan",
      lastName: "Perez",
      middleName: null,
    },
    doctor: {
      id: mockDoctorId,
      name: "Dr. Smith",
      specialty: "GENERAL",
    },
  }

  const mockNoteDetail = {
    ...mockNoteListItem,
    currentIllness: "Dolor intenso",
    vitalSigns: { temperature: 37.5 },
    physicalExam: "Normal",
    prognosis: "Bueno",
    treatment: "Analgésicos",
    notes: "Seguimiento en 1 semana",
    doctor: {
      id: mockDoctorId,
      name: "Dr. Smith",
      email: "dr.smith@example.com",
      specialty: "GENERAL",
      licenseNumber: "12345",
    },
    appointment: null,
    prescriptions: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listByClinic", () => {
    it("should return paginated medical notes", async () => {
      const mockResult = {
        data: [mockNoteListItem],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }
      vi.mocked(medicalNoteRepository.findByClinic).mockResolvedValue(mockResult)

      const result = await medicalNoteService.listByClinic(mockClinicId, {}, 1, 10)

      expect(result).toEqual(mockResult)
      expect(medicalNoteRepository.findByClinic).toHaveBeenCalledWith(mockClinicId, {}, 1, 10)
    })

    it("should pass filters correctly", async () => {
      const filters = {
        patientId: "2",
        doctorId: mockDoctorId,
        search: "migraña",
      }
      vi.mocked(medicalNoteRepository.findByClinic).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      })

      await medicalNoteService.listByClinic(mockClinicId, filters, 1, 10)

      expect(medicalNoteRepository.findByClinic).toHaveBeenCalledWith(
        mockClinicId,
        filters,
        1,
        10
      )
    })
  })

  describe("getById", () => {
    it("should return note detail and log audit", async () => {
      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(mockNoteDetail)

      const result = await medicalNoteService.getById(BigInt(1), mockClinicId, mockUserId)

      expect(result).toEqual(mockNoteDetail)
    })

    it("should return null if note not found", async () => {
      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(null)

      const result = await medicalNoteService.getById(BigInt(999), mockClinicId, mockUserId)

      expect(result).toBeNull()
    })
  })

  describe("create", () => {
    it("should create a new medical note", async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as never)
      vi.mocked(medicalNoteRepository.findByAppointmentId).mockResolvedValue(null)
      vi.mocked(medicalNoteRepository.create).mockResolvedValue(mockNoteListItem)

      const input = {
        patientId: mockPatientId,
        chiefComplaint: "Dolor de cabeza",
        diagnosis: "Migraña",
      }

      const result = await medicalNoteService.create(
        mockClinicId,
        mockDoctorId,
        input,
        mockUserId
      )

      expect(result).toEqual(mockNoteListItem)
      expect(medicalNoteRepository.create).toHaveBeenCalledWith(
        mockClinicId,
        mockDoctorId,
        input
      )
    })

    it("should throw error if patient not found", async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const input = {
        patientId: mockPatientId,
        chiefComplaint: "Dolor de cabeza",
        diagnosis: "Migraña",
      }

      await expect(
        medicalNoteService.create(mockClinicId, mockDoctorId, input, mockUserId)
      ).rejects.toThrow("Paciente no encontrado")
    })

    it("should update existing note if appointment already has one", async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as never)
      vi.mocked(medicalNoteRepository.findByAppointmentId).mockResolvedValue({ id: BigInt(10) })
      vi.mocked(medicalNoteRepository.update).mockResolvedValue(mockNoteListItem)

      const input = {
        patientId: mockPatientId,
        appointmentId: mockAppointmentId,
        chiefComplaint: "Dolor de cabeza actualizado",
        diagnosis: "Migraña crónica",
      }

      const result = await medicalNoteService.create(
        mockClinicId,
        mockDoctorId,
        input,
        mockUserId
      )

      expect(result).toEqual(mockNoteListItem)
      expect(medicalNoteRepository.update).toHaveBeenCalled()
      expect(medicalNoteRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        mockAppointmentId,
        "COMPLETED"
      )
      expect(medicalNoteRepository.create).not.toHaveBeenCalled()
    })

    it("should set appointment status to IN_PROGRESS when creating note", async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as never)
      vi.mocked(medicalNoteRepository.findByAppointmentId).mockResolvedValue(null)
      vi.mocked(medicalNoteRepository.create).mockResolvedValue(mockNoteListItem)

      const input = {
        patientId: mockPatientId,
        appointmentId: mockAppointmentId,
        chiefComplaint: "Dolor de cabeza",
        diagnosis: "Migraña",
      }

      await medicalNoteService.create(mockClinicId, mockDoctorId, input, mockUserId)

      expect(medicalNoteRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        mockAppointmentId,
        "IN_PROGRESS"
      )
    })

    it("should not update appointment status when no appointmentId", async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as never)
      vi.mocked(medicalNoteRepository.create).mockResolvedValue(mockNoteListItem)

      const input = {
        patientId: mockPatientId,
        chiefComplaint: "Dolor de cabeza",
        diagnosis: "Migraña",
      }

      await medicalNoteService.create(mockClinicId, mockDoctorId, input, mockUserId)

      expect(medicalNoteRepository.updateAppointmentStatus).not.toHaveBeenCalled()
    })
  })

  describe("update", () => {
    it("should update note and set appointment status to COMPLETED", async () => {
      const mockNoteWithAppointment = {
        ...mockNoteDetail,
        appointmentId: "3",
        appointment: {
          id: "3",
          clinicId: "1",
          patientId: "2",
          doctorId: mockDoctorId,
          startTime: new Date(),
          endTime: new Date(),
          status: "IN_PROGRESS",
          reason: "Consulta",
          notes: null,
        },
      }

      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(mockNoteWithAppointment as never)
      vi.mocked(medicalNoteRepository.update).mockResolvedValue(mockNoteListItem)

      const input = {
        diagnosis: "Migraña actualizada",
        treatment: "Nuevos medicamentos",
      }

      const result = await medicalNoteService.update(
        BigInt(1),
        mockClinicId,
        input,
        mockUserId
      )

      expect(result).toEqual(mockNoteListItem)
      expect(medicalNoteRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        BigInt(3),
        "COMPLETED"
      )
    })

    it("should throw error if note not found", async () => {
      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(null)

      const input = { diagnosis: "Nueva diagnóstico" }

      await expect(
        medicalNoteService.update(BigInt(999), mockClinicId, input, mockUserId)
      ).rejects.toThrow("Nota medica no encontrada")
    })

    it("should parse vitalSigns string to object", async () => {
      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(mockNoteDetail as never)
      vi.mocked(medicalNoteRepository.update).mockResolvedValue(mockNoteListItem)

      const input = {
        vitalSigns: '{"temperature": 37.5, "heartRate": 80}',
      }

      await medicalNoteService.update(BigInt(1), mockClinicId, input, mockUserId)

      expect(medicalNoteRepository.update).toHaveBeenCalledWith(
        BigInt(1),
        expect.objectContaining({
          vitalSigns: { temperature: 37.5, heartRate: 80 },
        })
      )
    })

    it("should handle invalid vitalSigns JSON", async () => {
      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(mockNoteDetail as never)
      vi.mocked(medicalNoteRepository.update).mockResolvedValue(mockNoteListItem)

      const input = {
        vitalSigns: "invalid-json",
      }

      await medicalNoteService.update(BigInt(1), mockClinicId, input, mockUserId)

      expect(medicalNoteRepository.update).toHaveBeenCalledWith(
        BigInt(1),
        expect.objectContaining({
          vitalSigns: undefined,
        })
      )
    })

    it("should not update appointment status if no appointment", async () => {
      vi.mocked(medicalNoteRepository.findById).mockResolvedValue(mockNoteDetail as never)
      vi.mocked(medicalNoteRepository.update).mockResolvedValue(mockNoteListItem)

      const input = { diagnosis: "Nueva diagnóstico" }

      await medicalNoteService.update(BigInt(1), mockClinicId, input, mockUserId)

      expect(medicalNoteRepository.updateAppointmentStatus).not.toHaveBeenCalled()
    })
  })
})
