import { PrismaClient, Role, Gender, BloodType, AppointmentStatus, InvoiceStatus, PaymentMethod } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main()
{
  console.log('Starting database seed...')

  // 1. Create Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Clínica Médica Ejemplo',
      rfc: 'CME123456ABC',
      address: 'Av. Principal 123, Ciudad de México',
      phone: '555-123-4567',
      email: 'contacto@clinicaejemplo.com',
    },
  })
  console.log(`Created clinic: ${clinic.name}`)

  // 2. Create Service Categories
  const categories = await prisma.serviceCategory.createMany({
    data: [
      { clinicId: clinic.id, name: 'Consultas', color: '#3b82f6', sortOrder: 1 },
      { clinicId: clinic.id, name: 'Procedimientos', color: '#10b981', sortOrder: 2 },
      { clinicId: clinic.id, name: 'Laboratorio', color: '#f59e0b', sortOrder: 3 },
      { clinicId: clinic.id, name: 'Imagenología', color: '#8b5cf6', sortOrder: 4 },
    ],
  })
  console.log('Created service categories')

  // Get category IDs
  const consultasCategory = await prisma.serviceCategory.findFirst({
    where: { clinicId: clinic.id, name: 'Consultas' },
  })

  // 3. Create Services
  const services = await prisma.service.createMany({
    data: [
      {
        clinicId: clinic.id,
        categoryId: consultasCategory!.id,
        name: 'Consulta General',
        description: 'Consulta médica general',
        basePrice: 500.00,
        duration: 30,
      },
      {
        clinicId: clinic.id,
        categoryId: consultasCategory!.id,
        name: 'Consulta Especialista',
        description: 'Consulta con especialista',
        basePrice: 800.00,
        duration: 45,
      },
      {
        clinicId: clinic.id,
        name: 'Electrocardiograma',
        description: 'Estudio de electrocardiograma',
        basePrice: 350.00,
        duration: 20,
      },
    ],
  })
  console.log('Created services')

  // 4. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
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

  const patient2 = await prisma.patient.create({
    data: {
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
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@clinica.com',
        password: 'Admin123!',
        name: 'Administrador Principal',
        role: 'ADMIN',
        clinicId: clinic.id,
        licenseNumber: 'ADMIN001',
        specialty: 'Administración',
      }),
    })
    if (response.ok)
    {
      console.log('Created admin user: admin@clinica.com / Admin123!')
    } else
    {
      console.log('Admin user might already exist')
    }
  } catch (error)
  {
    console.log('Note: Create admin user manually via API or UI')
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

main()
  .catch((e) =>
  {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () =>
  {
    await prisma.$disconnect()
  })
