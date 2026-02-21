import { prisma } from "@/lib/prisma"
import type {
  ImagingOrderListItem,
  ImagingOrderDetail,
  ImagingOrderFilters,
  CreateImagingOrderInput,
  UpdateImagingOrderInput,
} from "./types"

function mapImagingOrderToListItem(order: any): ImagingOrderListItem {
  return {
    id: order.id.toString(),
    clinicId: order.clinicId.toString(),
    patientId: order.patientId.toString(),
    doctorId: order.doctorId,
    medicalNoteId: order.medicalNoteId?.toString() ?? null,
    orderDate: order.orderDate,
    studyType: order.studyType,
    bodyPart: order.bodyPart,
    reason: order.reason,
    clinicalNotes: order.clinicalNotes,
    status: order.status,
    reportUrl: order.reportUrl,
    imagesUrl: order.imagesUrl,
    reportFileName: order.reportFileName,
    imagesFileName: order.imagesFileName,
    findings: order.findings,
    impression: order.impression,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    patient: {
      id: order.patient.id.toString(),
      firstName: order.patient.firstName,
      lastName: order.patient.lastName,
      middleName: order.patient.middleName,
      curp: order.patient.curp,
      birthDate: order.patient.birthDate,
    },
    doctor: {
      id: order.doctor.id,
      name: order.doctor.name,
      specialty: order.doctor.specialty,
      licenseNumber: order.doctor.licenseNumber,
    },
  }
}

export const imagingOrderRepository = {
  async findMany(
    clinicId: bigint,
    filters: ImagingOrderFilters
  ): Promise<ImagingOrderListItem[]> {
    const where: Record<string, unknown> = { clinicId }

    if (filters.patientId) where.patientId = BigInt(filters.patientId)
    if (filters.status) where.status = filters.status
    if (filters.doctorId) where.doctorId = filters.doctorId
    if (filters.studyType) where.studyType = filters.studyType
    if (filters.medicalNoteId) where.medicalNoteId = BigInt(filters.medicalNoteId)

    if (filters.fromDate || filters.toDate) {
      where.orderDate = {}
      if (filters.fromDate) (where.orderDate as Record<string, Date>).gte = filters.fromDate
      if (filters.toDate) (where.orderDate as Record<string, Date>).lte = filters.toDate
    }

    const orders = await prisma.imagingOrder.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
    })

    return orders.map(mapImagingOrderToListItem)
  },

  async findById(id: bigint, clinicId: bigint): Promise<ImagingOrderDetail | null> {
    const order = await prisma.imagingOrder.findFirst({
      where: { id, clinicId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
            birthDate: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
          },
        },
      },
    })

    if (!order) return null
    return mapImagingOrderToListItem(order)
  },

  async create(
    clinicId: bigint,
    input: CreateImagingOrderInput
  ): Promise<ImagingOrderListItem> {
    const order = await prisma.imagingOrder.create({
      data: {
        clinicId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        medicalNoteId: input.medicalNoteId,
        studyType: input.studyType,
        bodyPart: input.bodyPart,
        reason: input.reason,
        clinicalNotes: input.clinicalNotes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return mapImagingOrderToListItem(order)
  },

  async update(id: bigint, data: UpdateImagingOrderInput): Promise<ImagingOrderListItem> {
    const updateData: Record<string, unknown> = { ...data }

    if (data.status === "COMPLETED") {
      updateData.completedAt = new Date()
    }

    const order = await prisma.imagingOrder.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return mapImagingOrderToListItem(order)
  },

  async delete(id: bigint): Promise<void> {
    await prisma.imagingOrder.delete({
      where: { id },
    })
  },

  async patientExistsInClinic(patientId: bigint, clinicId: bigint): Promise<boolean> {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId, deletedAt: null },
      select: { id: true },
    })
    return !!patient
  },
}
