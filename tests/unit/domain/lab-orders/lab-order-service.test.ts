import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  labOrderService,
  PatientNotFoundError,
  LabOrderNotFoundError,
} from "@/lib/domain/lab-orders/lab-order-service"
import { labOrderRepository } from "@/lib/domain/lab-orders/lab-order-repository"

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}))

vi.mock("@/lib/domain/lab-orders/lab-order-repository", () => ({
  labOrderRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createResults: vi.fn(),
    updateStatus: vi.fn(),
    patientExistsInClinic: vi.fn(),
  },
}))

describe("LabOrderService", () => {
  const mockClinicId = BigInt(1)
  const mockPatientId = BigInt(2)
  const mockDoctorId = "doctor-123"
  const mockUserId = "user-123"

  const mockTests = [{ name: "Biometría hemática", code: "BH01" }]

  const mockLabOrderListItem = {
    id: "1",
    clinicId: "1",
    patientId: "2",
    doctorId: mockDoctorId,
    medicalNoteId: null,
    orderDate: new Date(),
    tests: mockTests,
    instructions: "Ayuno de 8 horas",
    status: "PENDING" as const,
    resultsFileUrl: null,
    resultsFileName: null,
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
    results: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listByClinic", () => {
    it("should return lab orders", async () => {
      vi.mocked(labOrderRepository.findMany).mockResolvedValue([mockLabOrderListItem])

      const result = await labOrderService.listByClinic(mockClinicId, {})

      expect(result).toEqual([mockLabOrderListItem])
      expect(labOrderRepository.findMany).toHaveBeenCalledWith(mockClinicId, {})
    })

    it("should pass filters correctly", async () => {
      vi.mocked(labOrderRepository.findMany).mockResolvedValue([])

      const filters = { patientId: "2", status: "PENDING" as const }
      await labOrderService.listByClinic(mockClinicId, filters)

      expect(labOrderRepository.findMany).toHaveBeenCalledWith(mockClinicId, filters)
    })
  })

  describe("getById", () => {
    it("should return lab order and log audit", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(mockLabOrderListItem)

      const result = await labOrderService.getById(BigInt(1), mockClinicId, mockUserId)

      expect(result).toEqual(mockLabOrderListItem)
    })

    it("should throw LabOrderNotFoundError if not found", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(null)

      await expect(
        labOrderService.getById(BigInt(999), mockClinicId, mockUserId)
      ).rejects.toThrow(LabOrderNotFoundError)
    })
  })

  describe("create", () => {
    it("should create lab order successfully", async () => {
      vi.mocked(labOrderRepository.patientExistsInClinic).mockResolvedValue(true)
      vi.mocked(labOrderRepository.create).mockResolvedValue(mockLabOrderListItem)

      const input = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        tests: mockTests,
        instructions: "Ayuno de 8 horas",
      }

      const result = await labOrderService.create(mockClinicId, input, mockUserId)

      expect(result).toEqual(mockLabOrderListItem)
      expect(labOrderRepository.create).toHaveBeenCalledWith(mockClinicId, input)
    })

    it("should throw PatientNotFoundError if patient not in clinic", async () => {
      vi.mocked(labOrderRepository.patientExistsInClinic).mockResolvedValue(false)

      const input = {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        tests: mockTests,
      }

      await expect(
        labOrderService.create(mockClinicId, input, mockUserId)
      ).rejects.toThrow(PatientNotFoundError)
    })
  })

  describe("update", () => {
    it("should update lab order", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(mockLabOrderListItem)
      vi.mocked(labOrderRepository.update).mockResolvedValue(mockLabOrderListItem)

      const input = { status: "COMPLETED" as const }

      const result = await labOrderService.update(BigInt(1), mockClinicId, input, mockUserId)

      expect(result).toEqual(mockLabOrderListItem)
    })

    it("should throw LabOrderNotFoundError if not found", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(null)

      await expect(
        labOrderService.update(BigInt(999), mockClinicId, {}, mockUserId)
      ).rejects.toThrow(LabOrderNotFoundError)
    })
  })

  describe("delete", () => {
    it("should delete lab order", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(mockLabOrderListItem)

      await labOrderService.delete(BigInt(1), mockClinicId, mockUserId)

      expect(labOrderRepository.delete).toHaveBeenCalledWith(BigInt(1))
    })

    it("should throw LabOrderNotFoundError if not found", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(null)

      await expect(
        labOrderService.delete(BigInt(999), mockClinicId, mockUserId)
      ).rejects.toThrow(LabOrderNotFoundError)
    })
  })

  describe("addResults", () => {
    it("should add results and update status to COMPLETED", async () => {
      const mockResults = [
        {
          id: "1",
          labOrderId: "1",
          testName: "Glucosa",
          result: "95",
          unit: "mg/dL",
          referenceRange: "70-100",
          flag: null as any,
          resultDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(labOrderRepository.findById).mockResolvedValue(mockLabOrderListItem)
      vi.mocked(labOrderRepository.createResults).mockResolvedValue(mockResults)

      const input = [{ testName: "Glucosa", result: "95", unit: "mg/dL", referenceRange: "70-100" }]

      const result = await labOrderService.addResults(BigInt(1), mockClinicId, input, mockUserId)

      expect(result).toEqual(mockResults)
      expect(labOrderRepository.updateStatus).toHaveBeenCalledWith(BigInt(1), "COMPLETED")
    })

    it("should throw LabOrderNotFoundError if lab order not found", async () => {
      vi.mocked(labOrderRepository.findById).mockResolvedValue(null)

      await expect(
        labOrderService.addResults(BigInt(999), mockClinicId, [], mockUserId)
      ).rejects.toThrow(LabOrderNotFoundError)
    })
  })
})
