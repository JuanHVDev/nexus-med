/**
 * Script para crear usuarios de prueba en Better-Auth
 * Ejecutar: pnpm tsx scripts/create-test-users.ts
 */

import { auth } from '@/lib/auth'

async function createTestUsers() {
  console.log('🔧 Creando usuarios de prueba...')

  try {
    // Crear usuario admin
    console.log('⏳ Creando admin@clinic.com...')
    try {
      const admin = await auth.api.signUpEmail({
        body: {
          email: 'admin@clinic.com',
          password: 'password123',
          name: 'Admin User',
          role: 'ADMIN',
          clinicId: 1,
        } as any,
      })
      console.log('✅ Admin creado:', admin.user?.email)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ Admin ya existe')
      } else {
        console.error('❌ Error creando admin:', error.message)
      }
    }

    // Crear usuario doctor
    console.log('⏳ Creando doctor@clinic.com...')
    try {
      const doctor = await auth.api.signUpEmail({
        body: {
          email: 'doctor@clinic.com',
          password: 'password123',
          name: 'Dr. Juan Perez',
          role: 'DOCTOR',
          clinicId: 1,
          specialty: 'Medicina General',
          licenseNumber: '12345678',
        } as any,
      })
      console.log('✅ Doctor creado:', doctor.user?.email)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️ Doctor ya existe')
      } else {
        console.error('❌ Error creando doctor:', error.message)
      }
    }

    console.log('🎉 Usuarios de prueba listos!')
    console.log('')
    console.log('Credenciales:')
    console.log('  Admin: admin@clinic.com / password123')
    console.log('  Doctor: doctor@clinic.com / password123')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

createTestUsers()
