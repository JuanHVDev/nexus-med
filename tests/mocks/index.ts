import { vi } from 'vitest'

export const mockSession = {
  user: {
    id: 'user-test-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
    clinicId: '1',
    image: null,
    emailVerified: true,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockDoctorSession = {
  user: {
    id: 'user-doctor-1',
    name: 'Dr. Juan Pérez',
    email: 'juan.perez@example.com',
    role: 'DOCTOR',
    clinicId: '1',
    specialty: 'Medicina General',
    licenseNumber: '12345678',
    image: null,
    emailVerified: true,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockReceptionistSession = {
  user: {
    id: 'user-reception-1',
    name: 'Maria López',
    email: 'maria@example.com',
    role: 'RECEPTIONIST',
    clinicId: '1',
    image: null,
    emailVerified: true,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockPatient = {
  id: BigInt(1),
  clinicId: BigInt(1),
  firstName: 'Juan',
  lastName: 'Pérez',
  middleName: 'Carlos',
  curp: 'PEAJ900515HNLRRN01',
  birthDate: new Date('1990-05-15'),
  gender: 'MALE',
  bloodType: 'O_POSITIVE',
  email: 'juan.perez@example.com',
  phone: '5551234567',
  mobile: '5559876543',
  address: 'Av. Principal 123',
  city: 'Ciudad de México',
  state: 'CDMX',
  zipCode: '01000',
  isActive: true,
  notes: 'Paciente estable',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockClinic = {
  id: BigInt(1),
  name: 'Clínica Medical',
  rfc: 'CME210101ABC',
  address: 'Av. Médica 456',
  phone: '5555001000',
  email: 'contacto@clinicamedical.com',
  isActive: true,
  workingHours: null,
  appointmentDuration: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockDoctor = {
  id: 'user-doctor-1',
  name: 'Dr. Juan Pérez',
  email: 'juan.perez@example.com',
  role: 'DOCTOR',
  specialty: 'Medicina General',
  licenseNumber: '12345678',
  phone: '5551234567',
  isActive: true,
  clinicId: BigInt(1),
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockAppointment = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'user-doctor-1',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
  status: 'SCHEDULED',
  reason: 'Consulta general',
  notes: 'Primera vez',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockMedicalNote = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'user-doctor-1',
  appointmentId: BigInt(1),
  specialty: 'GENERAL',
  type: 'CONSULTATION',
  chiefComplaint: 'Dolor de cabeza',
  currentIllness: 'Inicio hace 3 días',
  vitalSigns: JSON.stringify({
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
  }),
  physicalExam: 'Paciente en buenas condiciones',
  diagnosis: 'Cefalea tensional',
  prognosis: 'Bueno',
  treatment: 'Paracetamol 500mg',
  notes: 'Seguimiento en una semana',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockPrescription = {
  id: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'user-doctor-1',
  medicalNoteId: BigInt(1),
  medications: JSON.stringify([
    { name: 'Paracetamol', dosage: '500mg', route: 'Oral' },
  ]),
  instructions: 'Seguir tratamiento',
  issueDate: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  digitalSignature: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockInvoice = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  clinicInvoiceNumber: 'INV-001',
  issuedById: 'user-admin-1',
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  subtotal: 300,
  tax: 0,
  discount: 0,
  total: 300,
  status: 'PENDING',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const createMockPrisma = () => ({
  patient: {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockPatient),
    update: vi.fn().mockResolvedValue(mockPatient),
    delete: vi.fn().mockResolvedValue(mockPatient),
    count: vi.fn().mockResolvedValue(0),
  },
  appointment: {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockAppointment),
    update: vi.fn().mockResolvedValue(mockAppointment),
    delete: vi.fn().mockResolvedValue(mockAppointment),
    count: vi.fn().mockResolvedValue(0),
  },
  clinic: {
    findFirst: vi.fn().mockResolvedValue(mockClinic),
    findUnique: vi.fn().mockResolvedValue(mockClinic),
    update: vi.fn().mockResolvedValue(mockClinic),
  },
  user: {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(mockDoctor),
    create: vi.fn().mockResolvedValue(mockDoctor),
    update: vi.fn().mockResolvedValue(mockDoctor),
  },
  medicalNote: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockMedicalNote),
    update: vi.fn().mockResolvedValue(mockMedicalNote),
  },
  prescription: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockPrescription),
  },
  invoice: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockInvoice),
    update: vi.fn().mockResolvedValue(mockInvoice),
  },
  $transaction: vi.fn((callback) => callback(createMockPrisma())),
})

export const mockAuth = {
  api: {
    getSession: vi.fn().mockResolvedValue({ session: mockSession }),
  },
}

export const mockNextResponse = {
  json: vi.fn((data) => ({ json: () => data })),
}
