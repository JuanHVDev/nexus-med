import { testPrisma, testData } from './db-setup'
import { randomUUID } from 'crypto'
import type { UserRole } from '@prisma/client'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

export async function createSessionForUser(userId: string): Promise<string> {
  const sessionToken = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  
  await testPrisma.session.create({
    data: {
      id: generateId('session'),
      token: sessionToken,
      expiresAt,
      userId,
    },
  })

  return sessionToken
}

export async function getAuthHeaders(userId: string): Promise<Headers> {
  const sessionToken = await createSessionForUser(userId)
  
  const headers = new Headers()
  headers.append('Cookie', `better-auth.session_token=${sessionToken}`)
  
  return headers
}

export async function createTestUser(
  clinicId: bigint,
  role: UserRole,
  overrides?: { email?: string; name?: string }
) {
  const userId = generateId('user')
  const email = overrides?.email || `${role.toLowerCase()}_${Date.now()}@test.com`
  
  const user = await testPrisma.user.create({
    data: {
      id: userId,
      email,
      name: overrides?.name || `Test ${role}`,
      isActive: true,
      emailVerified: false,
    },
  })

  await testPrisma.account.create({
    data: {
      id: generateId('account'),
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: 'hashed_test_password',
    },
  })

  await testPrisma.userClinic.create({
    data: {
      userId: user.id,
      clinicId,
      role,
    },
  })

  return user
}

export async function createTestPatient(
  clinicId: bigint,
  overrides?: { firstName?: string; lastName?: string }
) {
  const patient = await testPrisma.patient.create({
    data: {
      clinicId,
      firstName: overrides?.firstName || 'Paciente',
      lastName: overrides?.lastName || `Test ${Date.now()}`,
      curp: `TEST${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`,
      birthDate: new Date('1990-01-01'),
      gender: 'MALE',
      phone: `555${Date.now()}`.substring(0, 10),
      isActive: true,
    },
  })

  return patient
}

export async function createTestAppointment(
  patientId: bigint,
  doctorId: string,
  clinicId: bigint,
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
) {
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

  const appointment = await testPrisma.appointment.create({
    data: {
      clinicId,
      patientId,
      doctorId,
      startTime,
      endTime,
      status,
      reason: 'Test appointment',
    },
  })

  return appointment
}

export function getTestClinicId(): bigint {
  return testData.clinics[0]?.id
}

export function getTestClinic2Id(): bigint {
  return testData.clinics[1]?.id
}

export function getTestAdminUser() {
  return testData.users.find(u => u.role === 'ADMIN' && u.clinicId === testData.clinics[0].id)
}

export function getTestDoctorUser() {
  return testData.users.find(u => u.role === 'DOCTOR' && u.clinicId === testData.clinics[0].id)
}

export function getTestDoctor2User() {
  const doctors = testData.users.filter(u => u.role === 'DOCTOR' && u.clinicId === testData.clinics[0].id)
  return doctors[1] || doctors[0]
}

export function getTestNurseUser() {
  return testData.users.find(u => u.role === 'NURSE' && u.clinicId === testData.clinics[0].id)
}

export function getTestPatient() {
  return testData.patients[0]
}

export function getTestPatient2() {
  return testData.patients[1]
}

export function getTestPatient3() {
  return testData.patients[2]
}

export function getTestService() {
  return testData.services[0]
}

export function getTestDoctor() {
  return testData.doctors[0]
}

export function getTestDoctor2() {
  return testData.doctors[1]
}

export { testData, testPrisma }
