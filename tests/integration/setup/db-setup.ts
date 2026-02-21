import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { beforeAll, afterAll } from 'vitest'

const testDbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_PUBO4c3Hqjfn@ep-snowy-glade-ai8ags8y-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const adapter = new PrismaPg({
  connectionString: testDbUrl,
  connectionTimeoutMillis: 15000,
  poolTimeout: 10000,
})

export const testPrisma = new PrismaClient({
  adapter,
})

export const testData = {
  clinics: [] as { id: bigint; name: string; rfc: string }[],
  users: [] as { id: string; email: string; name: string; role: string; clinicId: bigint }[],
  patients: [] as { id: bigint; firstName: string; lastName: string }[],
  doctors: [] as { id: string; name: string }[],
  services: [] as { id: bigint; name: string }[],
  appointments: [] as { id: bigint; status: string }[],
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

async function loadTestData() {
  try {
    // Get first clinic
    const clinics = await testPrisma.clinic.findMany({ take: 1 })
    if (clinics.length === 0) return null
    
    const clinic = clinics[0]
    testData.clinics = [clinic]
    
    // Get second clinic if exists
    const clinics2 = await testPrisma.clinic.findMany({ skip: 1, take: 1 })
    if (clinics2.length > 0) {
      testData.clinics.push(clinics2[0])
    } else {
      testData.clinics.push(clinic)
    }
    
    const clinicId = clinic.id
    
    // Get users with their clinic roles
    const users = await testPrisma.user.findMany({ take: 10 })
    const userClinics = await testPrisma.userClinic.findMany({
      where: { clinicId },
      take: 10
    })
    
    // Map users to testData with roles
    const userMap = new Map(userClinics.map(uc => [uc.userId, uc.role]))
    testData.users = users.slice(0, 5).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: userMap.get(u.id) || 'MEMBER',
      clinicId: clinicId
    }))
    
    // Get doctors from userClinics
    const doctorUserClinics = userClinics.filter(uc => uc.role === 'DOCTOR')
    const doctorIds = new Set(doctorUserClinics.map(uc => uc.userId))
    testData.doctors = users
      .filter(u => doctorIds.has(u.id))
      .map(u => ({ id: u.id, name: u.name }))
    
    // If no doctors found, use first user
    if (testData.doctors.length === 0 && users.length > 0) {
      testData.doctors = [{ id: users[0].id, name: users[0].name }]
    }
    
    // Get ALL patients (not just clinic-specific)
    const patients = await testPrisma.patient.findMany({ take: 10 })
    testData.patients = patients.map(p => ({ 
      id: p.id, 
      firstName: p.firstName, 
      lastName: p.lastName 
    }))
    
    // Get services
    const services = await testPrisma.service.findMany({ take: 10 })
    testData.services = services.map(s => ({ id: s.id, name: s.name }))
    
    // Get appointments
    const appointments = await testPrisma.appointment.findMany({ take: 10 })
    testData.appointments = appointments.map(a => ({ id: a.id, status: a.status }))
    
    return testData
  } catch (e) {
    console.log('Error loading test data:', e)
    return null
  }
}

async function seedTestData() {
  const testTimestamp = Date.now()
  
  const existingClinics = await testPrisma.clinic.findMany({
    where: { email: 'clinic1@test.com' },
    take: 1,
  })
  
  if (existingClinics.length > 0) {
    const loaded = await loadTestData()
    if (loaded) return testData
  }
  
  const clinic1 = await testPrisma.clinic.create({
    data: {
      name: 'Clínica Test 1',
      rfc: `TEST${testTimestamp}001`,
      address: 'Dirección Test 1',
      phone: '5551234001',
      email: 'clinic1@test.com',
      isActive: true,
    },
  })

  const clinic2 = await testPrisma.clinic.create({
    data: {
      name: 'Clínica Test 2',
      rfc: `TEST${testTimestamp}002`,
      address: 'Dirección Test 2',
      phone: '5551234002',
      email: 'clinic2@test.com',
      isActive: true,
    },
  })

  testData.clinics = [clinic1, clinic2]

  const admin1 = await testPrisma.user.create({
    data: {
      id: generateId('user'),
      email: 'admin1@test.com',
      name: 'Admin Test 1',
      isActive: true,
      emailVerified: false,
    },
  })

  await testPrisma.account.create({
    data: {
      id: generateId('account'),
      accountId: admin1.id,
      providerId: 'credential',
      userId: admin1.id,
      password: 'hashed_password_placeholder',
    },
  })

  await testPrisma.userClinic.create({
    data: {
      userId: admin1.id,
      clinicId: clinic1.id,
      role: 'ADMIN',
    },
  })

  const doctor1 = await testPrisma.user.create({
    data: {
      id: generateId('user'),
      email: 'doctor1@test.com',
      name: 'Dr. Juan Pérez',
      specialty: 'GENERAL',
      licenseNumber: 'JPL12345',
      isActive: true,
      emailVerified: false,
    },
  })

  await testPrisma.account.create({
    data: {
      id: generateId('account'),
      accountId: doctor1.id,
      providerId: 'credential',
      userId: doctor1.id,
      password: 'hashed_password_placeholder',
    },
  })

  await testPrisma.userClinic.create({
    data: {
      userId: doctor1.id,
      clinicId: clinic1.id,
      role: 'DOCTOR',
    },
  })

  const doctor2 = await testPrisma.user.create({
    data: {
      id: generateId('user'),
      email: 'doctor2@test.com',
      name: 'Dra. María García',
      specialty: 'CARDIOLOGY',
      licenseNumber: 'GCM54321',
      isActive: true,
      emailVerified: false,
    },
  })

  await testPrisma.account.create({
    data: {
      id: generateId('account'),
      accountId: doctor2.id,
      providerId: 'credential',
      userId: doctor2.id,
      password: 'hashed_password_placeholder',
    },
  })

  await testPrisma.userClinic.create({
    data: {
      userId: doctor2.id,
      clinicId: clinic1.id,
      role: 'DOCTOR',
    },
  })

  const nurse1 = await testPrisma.user.create({
    data: {
      id: generateId('user'),
      email: 'nurse1@test.com',
      name: 'Enfermero Test 1',
      isActive: true,
      emailVerified: false,
    },
  })

  await testPrisma.account.create({
    data: {
      id: generateId('account'),
      accountId: nurse1.id,
      providerId: 'credential',
      userId: nurse1.id,
      password: 'hashed_password_placeholder',
    },
  })

  await testPrisma.userClinic.create({
    data: {
      userId: nurse1.id,
      clinicId: clinic1.id,
      role: 'NURSE',
    },
  })

  const admin2 = await testPrisma.user.create({
    data: {
      id: generateId('user'),
      email: 'admin2@test.com',
      name: 'Admin Test 2',
      isActive: true,
      emailVerified: false,
    },
  })

  await testPrisma.account.create({
    data: {
      id: generateId('account'),
      accountId: admin2.id,
      providerId: 'credential',
      userId: admin2.id,
      password: 'hashed_password_placeholder',
    },
  })

  await testPrisma.userClinic.create({
    data: {
      userId: admin2.id,
      clinicId: clinic2.id,
      role: 'ADMIN',
    },
  })

  testData.users = [
    { id: admin1.id, email: admin1.email, name: admin1.name, role: 'ADMIN', clinicId: clinic1.id },
    { id: doctor1.id, email: doctor1.email, name: doctor1.name, role: 'DOCTOR', clinicId: clinic1.id },
    { id: doctor2.id, email: doctor2.email, name: doctor2.name, role: 'DOCTOR', clinicId: clinic1.id },
    { id: nurse1.id, email: nurse1.email, name: nurse1.name, role: 'NURSE', clinicId: clinic1.id },
    { id: admin2.id, email: admin2.email, name: admin2.name, role: 'ADMIN', clinicId: clinic2.id },
  ]

  testData.doctors = [
    { id: doctor1.id, name: doctor1.name },
    { id: doctor2.id, name: doctor2.name },
  ]

  const patient1 = await testPrisma.patient.create({
    data: {
      clinicId: clinic1.id,
      firstName: 'Paciente',
      lastName: 'Test 1',
      curp: `TEST${testTimestamp}P001`,
      birthDate: new Date('1990-01-15'),
      gender: 'MALE',
      bloodType: 'O_POSITIVE',
      phone: '5551112222',
      email: 'patient1@test.com',
      isActive: true,
    },
  })

  const patient2 = await testPrisma.patient.create({
    data: {
      clinicId: clinic1.id,
      firstName: 'Paciente',
      lastName: 'Test 2',
      curp: `TEST${testTimestamp}P002`,
      birthDate: new Date('1985-06-20'),
      gender: 'FEMALE',
      bloodType: 'A_POSITIVE',
      phone: '5553334444',
      email: 'patient2@test.com',
      isActive: true,
    },
  })

  const patient3 = await testPrisma.patient.create({
    data: {
      clinicId: clinic1.id,
      firstName: 'Paciente',
      lastName: 'Test 3',
      curp: `TEST${testTimestamp}P003`,
      birthDate: new Date('2000-12-10'),
      gender: 'MALE',
      bloodType: 'B_POSITIVE',
      phone: '5555556666',
      email: 'patient3@test.com',
      isActive: true,
    },
  })

  testData.patients = [
    { id: patient1.id, firstName: patient1.firstName, lastName: patient1.lastName },
    { id: patient2.id, firstName: patient2.firstName, lastName: patient2.lastName },
    { id: patient3.id, firstName: patient3.firstName, lastName: patient3.lastName },
  ]

  const service1 = await testPrisma.service.create({
    data: {
      clinicId: clinic1.id,
      name: 'Consulta Médica',
      description: 'Consulta general',
      basePrice: 500,
      duration: 30,
      isActive: true,
    },
  })

  const service2 = await testPrisma.service.create({
    data: {
      clinicId: clinic1.id,
      name: 'Biometría Hemática',
      description: 'Análisis de sangre',
      basePrice: 250,
      isActive: true,
    },
  })

  const service3 = await testPrisma.service.create({
    data: {
      clinicId: clinic1.id,
      name: 'Radiografía de Tórax',
      description: 'Estudio de imagen',
      basePrice: 350,
      isActive: true,
    },
  })

  testData.services = [
    { id: service1.id, name: service1.name },
    { id: service2.id, name: service2.name },
    { id: service3.id, name: service3.name },
  ]

  const now = new Date()
  const appointment1 = await testPrisma.appointment.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: 'SCHEDULED',
      reason: 'Consulta de control',
    },
  })

  const appointment2 = await testPrisma.appointment.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient2.id,
      doctorId: doctor1.id,
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: 'CONFIRMED',
      reason: 'Dolor de cabeza',
    },
  })

  const appointment3 = await testPrisma.appointment.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient3.id,
      doctorId: doctor2.id,
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: 'COMPLETED',
      reason: 'Revisión cardiaca',
    },
  })

  const appointment4 = await testPrisma.appointment.create({
    data: {
      clinicId: clinic1.id,
      patientId: patient1.id,
      doctorId: doctor2.id,
      startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: 'CANCELLED',
      reason: 'Cancelada por el paciente',
    },
  })

  testData.appointments = [
    { id: appointment1.id, status: appointment1.status },
    { id: appointment2.id, status: appointment2.status },
    { id: appointment3.id, status: appointment3.status },
    { id: appointment4.id, status: appointment4.status },
  ]

  return testData
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function cleanDatabase() {
  await testPrisma.payment.deleteMany().catch(() => {})
  await testPrisma.resultRelease.deleteMany().catch(() => {})
  await testPrisma.labResult.deleteMany().catch(() => {})
  await testPrisma.invoiceItem.deleteMany().catch(() => {})
  await testPrisma.invoice.deleteMany().catch(() => {})
  await testPrisma.prescription.deleteMany().catch(() => {})
  await testPrisma.labOrder.deleteMany().catch(() => {})
  await testPrisma.imagingOrder.deleteMany().catch(() => {})
  await testPrisma.medicalNote.deleteMany().catch(() => {})
  await testPrisma.appointment.deleteMany().catch(() => {})
  await testPrisma.emergencyContact.deleteMany().catch(() => {})
  await testPrisma.medicalHistory.deleteMany().catch(() => {})
  await testPrisma.patient.deleteMany().catch(() => {})
  await testPrisma.service.deleteMany().catch(() => {})
  await testPrisma.serviceCategory.deleteMany().catch(() => {})
  await testPrisma.clinicInvitation.deleteMany().catch(() => {})
  await testPrisma.auditLog.deleteMany().catch(() => {})
  await testPrisma.appointmentRequest.deleteMany().catch(() => {})
  await testPrisma.userClinic.deleteMany().catch(() => {})
  await testPrisma.session.deleteMany().catch(() => {})
  await testPrisma.account.deleteMany().catch(() => {})
  await testPrisma.verification.deleteMany().catch(() => {})
  await testPrisma.user.deleteMany().catch(() => {})
  await testPrisma.clinic.deleteMany().catch(() => {})
}

const globalState = globalThis as unknown as { isSeeded?: boolean; setupComplete?: boolean }

beforeAll(async () => {
  // Only seed once for all test files
  if (!globalState.setupComplete) {
    try {
      await testPrisma.$connect()
      
      // Check if we already have data
      const existingClinics = await testPrisma.clinic.findMany({ take: 1 })
      
      if (existingClinics.length === 0) {
        // No data, seed it
        await seedTestData()
      } else {
        // Data exists, load it
        await loadTestData()
      }
      
      globalState.setupComplete = true
      globalState.isSeeded = true
    } catch (error) {
      console.error('Error in setup:', error)
      throw error
    }
  }
}, 120000)

afterAll(async () => {
  try {
    await testPrisma.$disconnect()
  } catch {
    // Ignore
  }
}, 60000)
