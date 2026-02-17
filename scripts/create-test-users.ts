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
        } as Record<string, unknown>,
      })
      console.log('✅ Admin creado:', admin.user?.email)
    } catch (error: unknown) {
      const err = error as { message?: string }
      if (err.message?.includes('already exists')) {
        console.log('ℹ️ Admin ya existe')
      } else {
        console.error('❌ Error creando admin:', err.message)
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
        } as Record<string, unknown>,
      })
      console.log('✅ Doctor creado:', doctor.user?.email)
    } catch (error: unknown) {
      const err = error as { message?: string }
      if (err.message?.includes('already exists')) {
        console.log('ℹ️ Doctor ya existe')
      } else {
        console.error('❌ Error creando doctor:', err.message)
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
