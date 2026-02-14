import { hashPassword } from 'better-auth/crypto'
import { PrismaClient, Role, Gender, BloodType } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main()
{
  console.log('Starting database seed...')

  // 1. Create Clinic
  // 1. Create Clinic
  const clinic = await prisma.clinic.upsert({
    where: { rfc: 'CME123456ABC' },
    update: {},
    create: {
      name: 'Clínica Médica Ejemplo',
      rfc: 'CME123456ABC',
      address: 'Av. Principal 123, Ciudad de México',
      phone: '555-123-4567',
      email: 'contacto@clinicaejemplo.com',
    },
  })
  console.log(`Created clinic: ${clinic.name}`)

  // 2. Create Service Categories
  // 2. Create Service Categories
  const categoriesData = [
    { name: 'Consultas', color: '#3b82f6', sortOrder: 1 },
    { name: 'Procedimientos', color: '#10b981', sortOrder: 2 },
    { name: 'Laboratorio', color: '#f59e0b', sortOrder: 3 },
    { name: 'Imagenología', color: '#8b5cf6', sortOrder: 4 },
  ]

  for (const cat of categoriesData)
  {
    const existing = await prisma.serviceCategory.findFirst({
      where: { clinicId: clinic.id, name: cat.name }
    })
    if (!existing)
    {
      await prisma.serviceCategory.create({
        data: { ...cat, clinicId: clinic.id }
      })
    }
  }
  console.log('Created service categories')

  // Get category IDs
  const consultasCategory = await prisma.serviceCategory.findFirst({
    where: { clinicId: clinic.id, name: 'Consultas' },
  })

  // 3. Create Services
  // 3. Create Services
  const servicesData = [
    {
      categoryId: consultasCategory!.id,
      name: 'Consulta General',
      description: 'Consulta médica general',
      basePrice: 500.00,
      duration: 30,
    },
    {
      categoryId: consultasCategory!.id,
      name: 'Consulta Especialista',
      description: 'Consulta con especialista',
      basePrice: 800.00,
      duration: 45,
    },
    {
      name: 'Electrocardiograma',
      description: 'Estudio de electrocardiograma',
      basePrice: 350.00,
      duration: 20,
    },
  ]

  for (const svc of servicesData)
  {
    const existing = await prisma.service.findFirst({
      where: { clinicId: clinic.id, name: svc.name }
    })
    if (!existing)
    {
      await prisma.service.create({
        data: { ...svc, clinicId: clinic.id }
      })
    }
  }
  console.log('Created services')

  // 4. Create Patients
  // 4. Create Patients
  const patient1 = await prisma.patient.upsert({
    where: {
      clinicId_curp: {
        clinicId: clinic.id,
        curp: 'PEGJ800101HDFRNN09'
      }
    },
    update: {},
    create: {
      clinicId: clinic.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      middleName: 'García',
      curp: 'PEGJ800101HDFRNN09',
      birthDate: new Date('1980-01-01'),
      gender: Gender.MALE,
      bloodType: BloodType.O_POSITIVE,
      email: 'juan.perez@email.com',
      phone: '555-111-2222',
      mobile: '555-333-4444',
      address: 'Calle Paciente 456',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '01000',
      medicalHistory: {
        create: {
          allergies: ['Penicilina', 'Yodo'],
          currentMedications: ['Metformina 500mg'],
          chronicDiseases: ['Diabetes Tipo 2'],
          smoking: false,
          alcohol: false,
        },
      },
      emergencyContacts: {
        create: [
          {
            name: 'María Pérez',
            relation: 'Esposa',
            phone: '555-555-6666',
            isPrimary: true,
          },
        ],
      },
    },
  })
  console.log(`Created patient: ${patient1.firstName} ${patient1.lastName}`)

  const patient2 = await prisma.patient.upsert({
    where: {
      clinicId_curp: {
        clinicId: clinic.id,
        curp: 'GAAA850505MDFRNN02'
      }
    },
    update: {},
    create: {
      clinicId: clinic.id,
      firstName: 'Ana',
      lastName: 'García',
      curp: 'GAAA850505MDFRNN02',
      birthDate: new Date('1985-05-05'),
      gender: Gender.FEMALE,
      bloodType: BloodType.A_POSITIVE,
      phone: '555-777-8888',
      medicalHistory: {
        create: {
          allergies: [],
          currentMedications: [],
          chronicDiseases: [],
          smoking: false,
          alcohol: false,
        },
      },
    },
  })
  console.log(`Created patient: ${patient2.firstName} ${patient2.lastName}`)
  try
  {
    const email = 'admin@clinica.com'
    const password = 'Admin123!'
    const hashedPassword = await hashPassword(password)
    const adminUser = await prisma.user.create({
      data: {
        id: `admin_${Date.now()}`,
        email: email,
        name: 'Administrador Principal',
        role: 'ADMIN',
        clinicId: clinic.id,
        licenseNumber: 'ADMIN001',
        specialty: 'Administración',
        isActive: true,
        emailVerified: true,
      }
    })
    console.log("Admin ha sido creado")
    const account = await prisma.account.create({
      data: {
        id: `account_${Date.now()}`,
        accountId: adminUser.id,
        providerId: 'credential',
        userId: adminUser.id,
        password: hashedPassword,
      }
    })
    console.log('Admin user created directly in DB:', adminUser.email)
    console.log('Admin account created directly in DB:', account.id)
    console.log(adminUser)
    console.log(account)
  } catch (error)
  {
    console.log('Error creating admin user:', error instanceof Error ? error.message : String(error))
  }
  // Actualizar el summary al final:
  console.log('\n✅ Seed completed successfully!')
  console.log(`\nSummary:`)
  console.log(`- 1 Clinic created`)
  console.log(`- 4 Service Categories created`)
  console.log(`- 3 Services created`)
  console.log(`- 2 Patients created with medical history and emergency contacts`)
  console.log(`- Admin user: admin@clinica.com / Admin123!`)
}

// @ts-expect-error
BigInt.prototype.toJSON = function () { return this.toString() }

main()
  .catch((e) =>
  {
    console.error('Error during seed:', JSON.stringify(e, null, 2))
    process.exit(1)
  })
  .finally(async () =>
  {
    await prisma.$disconnect()
  })
