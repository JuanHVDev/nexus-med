import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll } from 'vitest'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
})

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

export default prisma
