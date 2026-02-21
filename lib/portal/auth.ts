import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { hashPassword } from 'better-auth/crypto'
import { randomUUID } from 'crypto'
import { z } from 'zod'

function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export const portalLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

export const portalRegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  phone: z.string().optional(),
  curp: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export interface PortalSession {
  userId: string
  email: string
  name: string
  patientName: string
  patientId: bigint
  clinicId: bigint
  clinicName: string
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('better-auth.session_token')?.value

  if (!sessionToken) return null

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        include: {
          patient: {
            include: {
              clinic: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  })

  if (!session || !session.user.patient) return null

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    patientName: session.user.name,
    patientId: session.user.patient.id,
    clinicId: session.user.patient.clinicId,
    clinicName: session.user.patient.clinic.name,
  }
}

export async function portalRegister(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  curp?: string
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() }
  })

  if (existingUser) {
    return { error: 'Ya existe una cuenta con este email' }
  }

  let patient = null

  if (data.curp) {
    patient = await prisma.patient.findFirst({
      where: {
        curp: data.curp,
        clinic: { isActive: true }
      }
    })
  }

  if (!patient && data.phone) {
    patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          { mobile: data.phone }
        ],
        clinic: { isActive: true }
      }
    })
  }

  if (!patient) {
    return { error: 'No se encontró un paciente con los datos proporcionados. Por favor contacta a tu clínica para registrarte.' }
  }

  if (patient.userId) {
    return { error: 'Ya existe una cuenta de portal para este paciente' }
  }

  try {
    const hashedPassword = await hashPassword(data.password)
    const userId = generateId('patient')

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email: data.email.toLowerCase(),
          name: `${data.firstName} ${data.lastName}`,
          role: 'PATIENT',
          isActive: true,
          emailVerified: false,
          patient: {
            connect: { id: patient!.id }
          }
        }
      })

      await tx.account.create({
        data: {
          id: generateId('account'),
          accountId: userId,
          providerId: 'credential',
          userId: userId,
          password: hashedPassword,
        }
      })
    })

    return {
      success: true,
      message: 'Tu cuenta ha sido creada. Ya puedes iniciar sesión.'
    }
  } catch (error) {
    console.error('Portal register error:', error)
    return { error: 'Error al crear la cuenta' }
  }
}

export async function portalLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('better-auth.session_token')
}
