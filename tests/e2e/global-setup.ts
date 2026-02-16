import { test as setup } from '@playwright/test'
import { execSync } from 'child_process'

setup('seed database', async () => {
  console.log('🌱 Seeding test database...')
  
  try {
    // Ejecutar seed de prisma
    execSync('pnpm test:db:seed', {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit',
    })
    console.log('✅ Database seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed database:', error)
    // No fallar el setup para permitir tests sin datos
    console.log('⚠️  Continuing without seed - tests may fail if users do not exist')
  }
})
