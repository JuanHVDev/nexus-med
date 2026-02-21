import { logAudit } from "@/lib/audit"
import { labOrderRepository } from "./lab-order-repository"
import type {
  LabOrderListItem,
  LabOrderDetail,
  LabOrderFilters,
  CreateLabOrderInput,
  UpdateLabOrderInput,
  LabResultItem,
  CreateLabResultInput,
  OrderStatus,
} from "./types"

export class PatientNotFoundError extends Error {
  constructor() {
    super("Patient not found")
    this.name = "PatientNotFoundError"
  }
}

export class LabOrderNotFoundError extends Error {
  constructor() {
    super("Lab order not found")
    this.name = "LabOrderNotFoundError"
  }
}

export const labOrderService = {
  async listByClinic(
    clinicId: bigint,
    filters: LabOrderFilters
  ): Promise<LabOrderListItem[]> {
    return labOrderRepository.findMany(clinicId, filters)
  },

  async getById(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<LabOrderDetail> {
    const order = await labOrderRepository.findById(id, clinicId)
    if (!order) throw new LabOrderNotFoundError()

    await logAudit(userId, {
      action: "READ",
      entityType: "LabOrder",
      entityId: id.toString(),
      entityName: `Orden de laboratorio - ${order.patient.firstName} ${order.patient.lastName}`,
    })

    return order
  },

  async create(
    clinicId: bigint,
    input: CreateLabOrderInput,
    userId: string
  ): Promise<LabOrderListItem> {
    const patientExists = await labOrderRepository.patientExistsInClinic(
      input.patientId,
      clinicId
    )
    if (!patientExists) throw new PatientNotFoundError()

    const order = await labOrderRepository.create(clinicId, input)

    await logAudit(userId, {
      action: "CREATE",
      entityType: "LabOrder",
      entityId: order.id,
      entityName: `Orden de laboratorio - ${order.patient.firstName} ${order.patient.lastName}`,
    })

    return order
  },

  async update(
    id: bigint,
    clinicId: bigint,
    data: UpdateLabOrderInput,
    userId: string
  ): Promise<LabOrderListItem> {
    const existing = await labOrderRepository.findById(id, clinicId)
    if (!existing) throw new LabOrderNotFoundError()

    const order = await labOrderRepository.update(id, data)

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "LabOrder",
      entityId: order.id,
      entityName: `Orden de laboratorio - ${order.patient.firstName} ${order.patient.lastName}`,
    })

    return order
  },

  async delete(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<void> {
    const existing = await labOrderRepository.findById(id, clinicId)
    if (!existing) throw new LabOrderNotFoundError()

    await labOrderRepository.delete(id)

    await logAudit(userId, {
      action: "DELETE",
      entityType: "LabOrder",
      entityId: id.toString(),
    })
  },

  async addResults(
    id: bigint,
    clinicId: bigint,
    results: CreateLabResultInput[],
    userId: string
  ): Promise<LabResultItem[]> {
    const existing = await labOrderRepository.findById(id, clinicId)
    if (!existing) throw new LabOrderNotFoundError()

    const createdResults = await labOrderRepository.createResults(id, results)

    await labOrderRepository.updateStatus(id, "COMPLETED")

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "LabOrder",
      entityId: id.toString(),
      entityName: `Resultados de laboratorio - ${existing.patient.firstName} ${existing.patient.lastName}`,
    })

    return createdResults
  },
}
