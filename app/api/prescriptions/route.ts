import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prescriptionInputSchema, prescriptionFilterSchema } from '@/lib/validations/prescription'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      patient: { clinicId: BigInt(session.user.clinicId!) },
    }

    if (patientId) {
      where.patientId = BigInt(patientId)
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { curp: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              curp: true,
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
              licenseNumber: true,
            }
          },
          medicalNote: {
            select: {
              id: true,
              createdAt: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prescription.count({ where }),
    ])

    return NextResponse.json({
      data: prescriptions.map(p => ({
        ...p,
        id: p.id.toString(),
        patientId: p.patientId.toString(),
        medicalNoteId: p.medicalNoteId.toString(),
        issueDate: p.issueDate?.toISOString() ?? null,
        validUntil: p.validUntil?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        patient: p.patient ? {
          ...p.patient,
          id: p.patient.id.toString(),
        } : null,
        doctor: p.doctor ? {
          ...p.doctor,
        } : null,
        medicalNote: p.medicalNote ? {
          ...p.medicalNote,
          id: p.medicalNote.id.toString(),
          createdAt: p.medicalNote.createdAt.toISOString(),
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json({ message: 'Error fetching prescriptions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = prescriptionInputSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { patientId, medicalNoteId, medications, instructions, validUntil } = validation.data

    const patientIdBigInt = BigInt(patientId)
    const medicalNoteIdBigInt = BigInt(medicalNoteId)

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientIdBigInt, clinicId: session.user.clinicId },
    })

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 })
    }

    // Verify medical note exists and belongs to patient
    const medicalNote = await prisma.medicalNote.findFirst({
      where: { id: medicalNoteIdBigInt, patientId: patientIdBigInt },
    })

    if (!medicalNote) {
      return NextResponse.json({ message: 'Medical note not found' }, { status: 404 })
    }

    // Check if prescription already exists for this note
    const existing = await prisma.prescription.findFirst({
      where: { medicalNoteId: medicalNoteIdBigInt },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Prescription already exists for this note' },
        { status: 400 }
      )
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: patientIdBigInt,
        doctorId: session.user.id,
        medicalNoteId: medicalNoteIdBigInt,
        medications: medications as unknown as any,
        instructions,
        validUntil: validUntil ? new Date(validUntil) : undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
          }
        },
      },
    })

    return NextResponse.json({
      ...prescription,
      id: prescription.id.toString(),
      patientId: prescription.patientId.toString(),
      medicalNoteId: prescription.medicalNoteId.toString(),
      patient: {
        ...prescription.patient,
        id: prescription.patient.id.toString(),
      },
      doctor: {
        ...prescription.doctor,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json({ message: 'Error creating prescription' }, { status: 500 })
  }
}
