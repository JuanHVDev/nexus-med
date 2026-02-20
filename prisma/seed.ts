import { hashPassword } from 'better-auth/crypto'
import { PrismaClient, Gender, BloodType, UserRole } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { randomUUID } from 'crypto'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

async function main() {
  console.log('Starting database seed...')

  const password = 'password123'
  const hashedPassword = await hashPassword(password)

  // Crear usuario admin
  const adminId = generateId('admin')
  await prisma.user.create({
    data: {
      id: adminId,
      email: 'admin@clinica.com',
      name: 'Dr. Admin Principal',
      specialty: 'Medicina General',
      licenseNumber: 'ADM12345',
      phone: '555-123-4567',
      isActive: true,
      emailVerified: true,
    },
  })

  await prisma.account.create({
    data: {
      id: generateId('account'),
      accountId: adminId,
      providerId: 'credential',
      userId: adminId,
      password: hashedPassword,
    },
  })

  // Crear clínica
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Clínica Médica Demo',
      rfc: 'DEMO123456ABC',
      address: 'Av. Principal 123, Ciudad de México',
      phone: '555-123-4567',
      email: 'contacto@demo.com',
    },
  })

  // Relacionar admin con clínica
  await prisma.userClinic.create({
    data: {
      userId: adminId,
      clinicId: clinic.id,
      role: UserRole.ADMIN,
    },
  })

  console.log(`Created admin user: admin@clinica.com / ${password}`)
  console.log(`Created clinic: ${clinic.name}`)

  // Crear doctor adicional
  const doctorId = generateId('doctor')
  await prisma.user.create({
    data: {
      id: doctorId,
      email: 'doctor@clinica.com',
      name: 'Dr. Roberto Vela',
      specialty: 'Medicina General',
      licenseNumber: 'MED12345',
      phone: '555-234-5678',
      isActive: true,
      emailVerified: true,
    },
  })

  await prisma.account.create({
    data: {
      id: generateId('account'),
      accountId: doctorId,
      providerId: 'credential',
      userId: doctorId,
      password: hashedPassword,
    },
  })

  await prisma.userClinic.create({
    data: {
      userId: doctorId,
      clinicId: clinic.id,
      role: UserRole.DOCTOR,
    },
  })

  console.log(`Created doctor user: doctor@clinica.com / ${password}`)

  // Crear paciente de prueba
  const patient = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      firstName: 'Juan',
      lastName: 'Pérez García',
      curp: 'PEGJ850315HDFRPN03',
      birthDate: new Date('1985-03-15'),
      gender: Gender.MALE,
      bloodType: BloodType.O_POSITIVE,
      email: 'juan.perez@email.com',
      phone: '555-345-6789',
      mobile: '555-456-7890',
      address: 'Calle Ficticia 456',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06600',
    },
  })

  console.log(`Created test patient: ${patient.firstName} ${patient.lastName}`)

  console.log('\n✅ Seed completed!')
  console.log('\nTest credentials:')
  console.log('  Admin: admin@clinica.com / password123')
  console.log('  Doctor: doctor@clinica.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
