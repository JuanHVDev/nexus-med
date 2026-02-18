import { hashPassword } from 'better-auth/crypto'
import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'

async function main() {
  console.log('🌱 Seeding test database...')

  // Create clinic
  const clinic = await prisma.clinic.upsert({
    where: { rfc: 'CME210101ABC' },
    update: {},
    create: {
      name: 'Clínica Medical Test',
      rfc: 'CME210101ABC',
      address: 'Av. Médica 456',
      phone: '5555001000',
      email: 'test@clinicamedical.com',
      isActive: true,
    },
  })

  console.log('✅ Clinic created:', clinic.name)

  // Create ADMIN user with Better-Auth credentials
  try {
    const email = 'admin@clinic.com'
    const password = 'password123'
    const hashedPassword = await hashPassword(password)
    
    const adminUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: 'user-admin-test',
        email: email,
        name: 'Admin Test',
        role: 'ADMIN',
        clinicId: clinic.id,
        licenseNumber: 'ADMIN001',
        specialty: 'Administración',
        isActive: true,
        emailVerified: true,
      }
    })
    
    // Check if account already exists
    const existingAdminAccount = await prisma.account.findFirst({
      where: {
        providerId: 'credential',
        userId: adminUser.id,
      }
    })
    
    if (!existingAdminAccount) {
      await prisma.account.create({
        data: {
          id: 'account-admin-test',
          accountId: adminUser.id,
          providerId: 'credential',
          userId: adminUser.id,
          password: hashedPassword,
        }
      })
    } else {
      // Update password if account exists
      await prisma.account.update({
        where: { id: existingAdminAccount.id },
        data: { password: hashedPassword }
      })
    }
    
    console.log('✅ Admin user created:', adminUser.email)
  } catch (error) {
    console.log('ℹ️ Admin user already exists or error:', error instanceof Error ? error.message : String(error))
  }

  // Create DOCTOR user with Better-Auth credentials
  try {
    const email = 'doctor@clinic.com'
    const password = 'password123'
    const hashedPassword = await hashPassword(password)
    
    const doctorUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: 'user-doctor-test',
        email: email,
        name: 'Dr. Juan Pérez',
        role: 'DOCTOR',
        specialty: 'Medicina General',
        licenseNumber: '12345678',
        clinicId: clinic.id,
        isActive: true,
        emailVerified: true,
      }
    })
    
    // Check if account already exists
    const existingDoctorAccount = await prisma.account.findFirst({
      where: {
        providerId: 'credential',
        userId: doctorUser.id,
      }
    })
    
    if (!existingDoctorAccount) {
      await prisma.account.create({
        data: {
          id: 'account-doctor-test',
          accountId: doctorUser.id,
          providerId: 'credential',
          userId: doctorUser.id,
          password: hashedPassword,
        }
      })
    } else {
      // Update password if account exists
      await prisma.account.update({
        where: { id: existingDoctorAccount.id },
        data: { password: hashedPassword }
      })
    }
    
    console.log('✅ Doctor user created:', doctorUser.email)
  } catch (error) {
    console.log('ℹ️ Doctor user already exists or error:', error instanceof Error ? error.message : String(error))
  }

  // Create NURSE user with Better-Auth credentials
  try {
    const email = 'nurse@clinic.com'
    const password = 'password123'
    const hashedPassword = await hashPassword(password)
    
    const nurseUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: 'user-nurse-test',
        email: email,
        name: 'Enfermera Test',
        role: 'NURSE',
        specialty: 'Enfermería General',
        licenseNumber: 'ENF12345',
        clinicId: clinic.id,
        isActive: true,
        emailVerified: true,
      }
    })
    
    const existingNurseAccount = await prisma.account.findFirst({
      where: {
        providerId: 'credential',
        userId: nurseUser.id,
      }
    })
    
    if (!existingNurseAccount) {
      await prisma.account.create({
        data: {
          id: 'account-nurse-test',
          accountId: nurseUser.id,
          providerId: 'credential',
          userId: nurseUser.id,
          password: hashedPassword,
        }
      })
    } else {
      await prisma.account.update({
        where: { id: existingNurseAccount.id },
        data: { password: hashedPassword }
      })
    }
    
    console.log('✅ Nurse user created:', nurseUser.email)
  } catch (error) {
    console.log('ℹ️ Nurse user already exists or error:', error instanceof Error ? error.message : String(error))
  }

  // Create RECEPTIONIST user with Better-Auth credentials
  try {
    const email = 'receptionist@clinic.com'
    const password = 'password123'
    const hashedPassword = await hashPassword(password)
    
    const receptionistUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: 'user-receptionist-test',
        email: email,
        name: 'Recepcionista Test',
        role: 'RECEPTIONIST',
        specialty: 'Recepción',
        licenseNumber: 'REP12345',
        clinicId: clinic.id,
        isActive: true,
        emailVerified: true,
      }
    })
    
    const existingReceptionistAccount = await prisma.account.findFirst({
      where: {
        providerId: 'credential',
        userId: receptionistUser.id,
      }
    })
    
    if (!existingReceptionistAccount) {
      await prisma.account.create({
        data: {
          id: 'account-receptionist-test',
          accountId: receptionistUser.id,
          providerId: 'credential',
          userId: receptionistUser.id,
          password: hashedPassword,
        }
      })
    } else {
      await prisma.account.update({
        where: { id: existingReceptionistAccount.id },
        data: { password: hashedPassword }
      })
    }
    
    console.log('✅ Receptionist user created:', receptionistUser.email)
  } catch (error) {
    console.log('ℹ️ Receptionist user already exists or error:', error instanceof Error ? error.message : String(error))
  }

  // Create test patients
  for (let i = 0; i < 5; i++) {
    const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' })
    await prisma.patient.upsert({
      where: { 
        clinicId_curp: { 
          clinicId: clinic.id, 
          curp: `TEST${birthDate.toISOString().slice(2, 8)}TES${i.toString().padStart(3, '0')}X` 
        } 
      },
      update: {},
      create: {
        clinicId: clinic.id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        curp: `TEST${birthDate.toISOString().slice(2, 8)}TES${i.toString().padStart(3, '0')}X`,
        birthDate: birthDate,
        gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
        bloodType: faker.helpers.arrayElement(['A_POSITIVE', 'B_POSITIVE', 'O_POSITIVE', 'AB_POSITIVE']),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        isActive: true,
      },
    })
  }

  console.log('✅ Test patients created')

  // Create test services
  const services = [
    { name: 'Consulta de Medicina General', basePrice: 300, duration: 30 },
    { name: 'Consulta de Especialidad', basePrice: 500, duration: 45 },
    { name: 'Biometría Hemática', basePrice: 250, duration: 0 },
    { name: 'Química Sanguínea', basePrice: 350, duration: 0 },
  ]

  for (const service of services) {
    await prisma.service.create({
      data: {
        clinicId: clinic.id,
        name: service.name,
        basePrice: service.basePrice,
        duration: service.duration,
        isActive: true,
      },
    }).catch(() => {
      // Service might already exist
    })
  }

  console.log('✅ Test services created')
  console.log('')
  console.log('🎉 Test database seeded successfully!')
  console.log('')
  console.log('📋 Test Credentials:')
  console.log('  Admin: admin@clinic.com / password123')
  console.log('  Doctor: doctor@clinic.com / password123')
  console.log('  Nurse: nurse@clinic.com / password123')
  console.log('  Receptionist: receptionist@clinic.com / password123')
}

main()
  .catch((e) => {
    console.error('Error seeding test database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
