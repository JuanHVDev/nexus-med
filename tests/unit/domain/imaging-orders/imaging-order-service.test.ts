import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  imagingOrderService,
  PatientNotFoundError,
  ImagingOrderNotFoundError,
} from "@/lib/domain/imaging-orders/imaging-order-service"
import { imagingOrderRepository } from "@/lib/domain/imaging-orders/imaging-order-repository"

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("@/lib/domain/imaging-orders/imaging-order-repository", () => ({
  imagingOrderRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    patientExistsInClinic: vi.fn(),
  },
}))

describe("ImagingOrderService", () => {
  const mockClinicId = BigInt(1)
  const mockPatientId = BigInt(2)
  const mockDoctorId = "doctor-123"
  const mockUserId = "user-123"

  const mockImagingOrderListItem = {
    id: "1",
    clinicId: "1",
    patientId: "2",
    doctorId: mockDoctorId,
    medicalNoteId: null,
    orderDate: new Date(),
    studyType: "RX",
    bodyPart: "Tórax",
    reason: "Dolor torácico",
    clinicalNotes: "Paciente con tos",
    status: "PENDING" as const,
    reportUrl: null,
    imagesUrl: null,
    reportFileName: null,
    imagesFileName: null,
    findings: null,
    impression: null,
    completedAt: null,
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
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listByClinic", () => {
    it("should return imaging orders", async () => {
      vi.mocked(imagingOrderRepository.findMany).mockResolvedValue([mockImagingOrderListItem])

      const result = await imagingOrderService.listByClinic(mockClinicId, {})

      expect(result).toEqual([mockImagingOrderListItem])
      expect(imagingOrderRepository.findMany).toHaveBeenCalledWith(mockClinicId, {})
    })

    it("should pass filters correctly", async () => {
      vi.mocked(imagingOrderRepository.findMany).mockResolvedValue([])

      const filters = { patientId: "2", studyType: "RX", status: "PENDING" as const }
      await imagingOrderService.listByClinic(mockClinicId, filters)

      expect(imagingOrderRepository.findMany).toHaveBeenCalledWith(mockClinicId, filters)
    })
  })

  describe("getById", () => {
    it("should return imaging order and log audit", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(mockImagingOrderListItem)

      const result = await imagingOrderService.getById(BigInt(1), mockClinicId, mockUserId)

      expect(result).toEqual(mockImagingOrderListItem)
    })

    it("should throw ImagingOrderNotFoundError if not found", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(null)

      await expect(
        imagingOrderService.getById(BigInt(999), mockClinicId, mockUserId)
      ).rejects.toThrow(ImagingOrderNotFoundError)
    })
  })

  describe("create", () => {
    it("should create imaging order successfully", async () => {
      vi.mocked(imagingOrderRepository.patientExistsInClinic).mockResolvedValue(true)
      vi.mocked(imagingOrderRepository.create).mockResolvedValue(mockImagingOrderListItem)

      const input = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        studyType: "RX",
        bodyPart: "Tórax",
        reason: "Dolor torácico",
      }

      const result = await imagingOrderService.create(mockClinicId, input, mockUserId)

      expect(result).toEqual(mockImagingOrderListItem)
      expect(imagingOrderRepository.create).toHaveBeenCalledWith(mockClinicId, input)
    })

    it("should throw PatientNotFoundError if patient not in clinic", async () => {
      vi.mocked(imagingOrderRepository.patientExistsInClinic).mockResolvedValue(false)

      const input = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        studyType: "RX",
        bodyPart: "Tórax",
      }

      await expect(
        imagingOrderService.create(mockClinicId, input, mockUserId)
      ).rejects.toThrow(PatientNotFoundError)
    })

    it("should create with medicalNoteId", async () => {
      vi.mocked(imagingOrderRepository.patientExistsInClinic).mockResolvedValue(true)
      vi.mocked(imagingOrderRepository.create).mockResolvedValue(mockImagingOrderListItem)

      const input = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        medicalNoteId: BigInt(3),
        studyType: "TAC",
        bodyPart: "Cráneo",
      }

      await imagingOrderService.create(mockClinicId, input, mockUserId)

      expect(imagingOrderRepository.create).toHaveBeenCalledWith(mockClinicId, input)
    })
  })

  describe("update", () => {
    it("should update imaging order", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(mockImagingOrderListItem)
      vi.mocked(imagingOrderRepository.update).mockResolvedValue(mockImagingOrderListItem)

      const input = { status: "COMPLETED" as const }

      const result = await imagingOrderService.update(BigInt(1), mockClinicId, input, mockUserId)

      expect(result).toEqual(mockImagingOrderListItem)
    })

    it("should throw ImagingOrderNotFoundError if not found", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(null)

      await expect(
        imagingOrderService.update(BigInt(999), mockClinicId, {}, mockUserId)
      ).rejects.toThrow(ImagingOrderNotFoundError)
    })

    it("should update with report files", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(mockImagingOrderListItem)
      vi.mocked(imagingOrderRepository.update).mockResolvedValue(mockImagingOrderListItem)

      const input = {
        reportUrl: "https://example.com/report.pdf",
        reportFileName: "report.pdf",
        findings: "Sin hallazgos patológicos",
        impression: "Estudio normal",
      }

      await imagingOrderService.update(BigInt(1), mockClinicId, input, mockUserId)

      expect(imagingOrderRepository.update).toHaveBeenCalledWith(BigInt(1), input)
    })
  })

  describe("delete", () => {
    it("should delete imaging order", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(mockImagingOrderListItem)

      await imagingOrderService.delete(BigInt(1), mockClinicId, mockUserId)

      expect(imagingOrderRepository.delete).toHaveBeenCalledWith(BigInt(1))
    })

    it("should throw ImagingOrderNotFoundError if not found", async () => {
      vi.mocked(imagingOrderRepository.findById).mockResolvedValue(null)

      await expect(
        imagingOrderService.delete(BigInt(999), mockClinicId, mockUserId)
      ).rejects.toThrow(ImagingOrderNotFoundError)
    })
  })
})
