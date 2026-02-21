import { prisma } from "@/lib/prisma"
import type {
  LabOrderListItem,
  LabOrderDetail,
  LabOrderFilters,
  CreateLabOrderInput,
  UpdateLabOrderInput,
  LabResultItem,
  CreateLabResultInput,
  LabTest,
} from "./types"

function mapLabResult(result: any): LabResultItem {
  return {
    id: result.id.toString(),
    labOrderId: result.labOrderId.toString(),
    testName: result.testName,
    result: result.result,
    unit: result.unit,
    referenceRange: result.referenceRange,
    flag: result.flag,
    resultDate: result.resultDate,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

function mapLabOrderToListItem(order: any): LabOrderListItem {
  return {
    id: order.id.toString(),
    clinicId: order.clinicId.toString(),
    patientId: order.patientId.toString(),
    doctorId: order.doctorId,
    medicalNoteId: order.medicalNoteId?.toString() ?? null,
    orderDate: order.orderDate,
    tests: order.tests as LabTest[],
    instructions: order.instructions,
    status: order.status,
    resultsFileUrl: order.resultsFileUrl,
    resultsFileName: order.resultsFileName,
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
    results: order.results?.map(mapLabResult) || [],
  }
}

export const labOrderRepository = {
  async findMany(
    clinicId: bigint,
    filters: LabOrderFilters
  ): Promise<LabOrderListItem[]> {
    const where: Record<string, unknown> = { clinicId }

    if (filters.patientId) where.patientId = BigInt(filters.patientId)
    if (filters.status) where.status = filters.status
    if (filters.doctorId) where.doctorId = filters.doctorId
    if (filters.medicalNoteId) where.medicalNoteId = BigInt(filters.medicalNoteId)

    if (filters.fromDate || filters.toDate) {
      where.orderDate = {}
      if (filters.fromDate) (where.orderDate as Record<string, Date>).gte = filters.fromDate
      if (filters.toDate) (where.orderDate as Record<string, Date>).lte = filters.toDate
    }

    const orders = await prisma.labOrder.findMany({
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
        results: true,
      },
      orderBy: { orderDate: "desc" },
    })

    return orders.map(mapLabOrderToListItem)
  },

  async findById(id: bigint, clinicId: bigint): Promise<LabOrderDetail | null> {
    const order = await prisma.labOrder.findFirst({
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
        results: true,
      },
    })

    if (!order) return null
    return mapLabOrderToListItem(order)
  },

  async create(
    clinicId: bigint,
    input: CreateLabOrderInput
  ): Promise<LabOrderListItem> {
    const order = await prisma.labOrder.create({
      data: {
        clinicId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        medicalNoteId: input.medicalNoteId,
        tests: input.tests as any,
        instructions: input.instructions,
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
        results: true,
      },
    })

    return mapLabOrderToListItem(order)
  },

  async update(id: bigint, data: UpdateLabOrderInput): Promise<LabOrderListItem> {
    const order = await prisma.labOrder.update({
      where: { id },
      data,
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
        results: true,
      },
    })

    return mapLabOrderToListItem(order)
  },

  async delete(id: bigint): Promise<void> {
    await prisma.labOrder.delete({
      where: { id },
    })
  },

  async createResults(
    labOrderId: bigint,
    results: CreateLabResultInput[]
  ): Promise<LabResultItem[]> {
    const createdResults = await Promise.all(
      results.map((result) =>
        prisma.labResult.create({
          data: {
            labOrderId,
            testName: result.testName,
            result: result.result ?? null,
            unit: result.unit ?? null,
            referenceRange: result.referenceRange ?? null,
            flag: result.flag ?? null,
            resultDate: result.result ? new Date() : null,
          },
        })
      )
    )

    return createdResults.map(mapLabResult)
  },

  async updateStatus(id: bigint, status: string): Promise<void> {
    await prisma.labOrder.update({
      where: { id },
      data: { status: status as any },
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
