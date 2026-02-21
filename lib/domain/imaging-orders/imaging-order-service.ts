import { logAudit } from "@/lib/audit"
import { imagingOrderRepository } from "./imaging-order-repository"
import type {
  ImagingOrderListItem,
  ImagingOrderDetail,
  ImagingOrderFilters,
  CreateImagingOrderInput,
  UpdateImagingOrderInput,
} from "./types"

export class PatientNotFoundError extends Error {
  constructor() {
    super("Patient not found")
    this.name = "PatientNotFoundError"
  }
}

export class ImagingOrderNotFoundError extends Error {
  constructor() {
    super("Imaging order not found")
    this.name = "ImagingOrderNotFoundError"
  }
}

export const imagingOrderService = {
  async listByClinic(
    clinicId: bigint,
    filters: ImagingOrderFilters
  ): Promise<ImagingOrderListItem[]> {
    return imagingOrderRepository.findMany(clinicId, filters)
  },

  async getById(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<ImagingOrderDetail> {
    const order = await imagingOrderRepository.findById(id, clinicId)
    if (!order) throw new ImagingOrderNotFoundError()

    await logAudit(userId, {
      action: "READ",
      entityType: "ImagingOrder",
      entityId: id.toString(),
      entityName: `Orden de imagenologia - ${order.patient.firstName} ${order.patient.lastName}`,
    })

    return order
  },

  async create(
    clinicId: bigint,
    input: CreateImagingOrderInput,
    userId: string
  ): Promise<ImagingOrderListItem> {
    const patientExists = await imagingOrderRepository.patientExistsInClinic(
      input.patientId,
      clinicId
    )
    if (!patientExists) throw new PatientNotFoundError()

    const order = await imagingOrderRepository.create(clinicId, input)

    await logAudit(userId, {
      action: "CREATE",
      entityType: "ImagingOrder",
      entityId: order.id,
      entityName: `Orden de imagenologia - ${order.patient.firstName} ${order.patient.lastName}`,
    })

    return order
  },

  async update(
    id: bigint,
    clinicId: bigint,
    data: UpdateImagingOrderInput,
    userId: string
  ): Promise<ImagingOrderListItem> {
    const existing = await imagingOrderRepository.findById(id, clinicId)
    if (!existing) throw new ImagingOrderNotFoundError()

    const order = await imagingOrderRepository.update(id, data)

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "ImagingOrder",
      entityId: order.id,
      entityName: `Orden de imagenologia - ${order.patient.firstName} ${order.patient.lastName}`,
    })

    return order
  },

  async delete(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<void> {
    const existing = await imagingOrderRepository.findById(id, clinicId)
    if (!existing) throw new ImagingOrderNotFoundError()

    await imagingOrderRepository.delete(id)

    await logAudit(userId, {
      action: "DELETE",
      entityType: "ImagingOrder",
      entityId: id.toString(),
    })
  },
}
