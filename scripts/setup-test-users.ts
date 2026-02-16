import { auth } from '@/lib/auth'

async function setupTestUsers() {
  console.log('🔧 Setting up test users...')

  try {
    // Create admin user
    const adminResult = await auth.api.signUpEmail({
      body: {
        email: 'admin@clinic.com',
        password: 'password123',
        name: 'Admin User',
        role: 'ADMIN',
        clinicId: 1,
      } as any,
    })
    console.log('✅ Admin user created:', adminResult.user?.email)

    // Create doctor user
    const doctorResult = await auth.api.signUpEmail({
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
    console.log('✅ Doctor user created:', doctorResult.user?.email)

    console.log('🎉 Test users setup complete!')
  } catch (error) {
    console.error('Error setting up test users:', error)
    process.exit(1)
  }
}

setupTestUsers()
