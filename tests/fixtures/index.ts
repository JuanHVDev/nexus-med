import { faker } from '@faker-js/faker'

export const generateCurp = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  let curp = ''
  for (let i = 0; i < 4; i++) curp += letters[Math.floor(Math.random() * letters.length)]
  for (let i = 0; i < 6; i++) curp += numbers[Math.floor(Math.random() * numbers.length)]
  curp += 'HN'
  for (let i = 0; i < 4; i++) curp += letters[Math.floor(Math.random() * letters.length)]
  curp += 'A'
  for (let i = 0; i < 2; i++) curp += numbers[Math.floor(Math.random() * numbers.length)]
  return curp
}

export const validPatient = {
  firstName: 'Juan',
  lastName: 'Pérez',
  middleName: 'Carlos',
  curp: generateCurp(),
  birthDate: '1990-05-15',
  gender: 'MALE' as const,
  bloodType: 'O_POSITIVE' as const,
  email: 'juan.perez@example.com',
  phone: '5551234567',
  mobile: '5559876543',
  address: 'Av. Principal 123',
  city: 'Ciudad de México',
  state: 'CDMX',
  zipCode: '01000',
  notes: 'Paciente estable',
}

export const invalidPatient = {
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: 'INVALID' as never,
}

export const validAppointment = {
  patientId: '1',
  doctorId: 'user-doctor-1',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  status: 'SCHEDULED' as const,
  reason: 'Consulta general',
  notes: 'Primera vez',
}

export const invalidAppointment = {
  patientId: '',
  doctorId: '',
  startTime: '',
  endTime: '',
  status: 'INVALID' as never,
}

export const validMedicalNote = {
  patientId: '1',
  specialty: 'GENERAL' as const,
  type: 'CONSULTATION' as const,
  chiefComplaint: 'Dolor de cabeza',
  currentIllness: 'Inicio hace 3 días',
  vitalSigns: {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    temperature: 36.5,
    weight: 70,
    height: 170,
    oxygenSaturation: 98,
    respiratoryRate: 16,
  },
  physicalExam: 'Paciente en buenas condiciones generales',
  diagnosis: 'Cefalea tensional',
  prognosis: 'Bueno',
  treatment: 'Paracetamol 500mg cada 6 horas por 5 días',
  notes: 'Seguimiento en una semana',
}

export const invalidMedicalNote = {
  patientId: '',
  chiefComplaint: '',
  diagnosis: '',
}

export const validPrescription = {
  patientId: '1',
  medicalNoteId: '1',
  medications: [
    {
      name: 'Paracetamol',
      dosage: '500mg',
      route: 'Oral',
      frequency: 'Cada 6 horas',
      duration: '5 días',
      instructions: 'Tomar con alimentos',
    },
  ],
  instructions: 'Seguir tratamiento indicado',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

export const invalidPrescription = {
  patientId: '',
  medicalNoteId: '',
  medications: [],
}

export const validInvoice = {
  patientId: '1',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Factura de consulta',
  items: [
    {
      description: 'Consulta de medicina general',
      quantity: 1,
      unitPrice: 300,
      discount: 0,
    },
  ],
}

export const invalidInvoice = {
  patientId: '',
  items: [],
}

export const validPayment = {
  amount: 300,
  method: 'CASH' as const,
  reference: 'REF001',
  notes: 'Pago en efectivo',
}

export const invalidPayment = {
  amount: -100,
  method: 'INVALID' as never,
}

export const validLabOrder = {
  patientId: '1',
  tests: [
    { name: 'Biometría hemática', code: 'BH001', price: 250 },
    { name: 'Química sanguínea', code: 'QS001', price: 350 },
  ],
  instructions: 'Ayuno de 12 horas',
}

export const validImagingOrder = {
  patientId: '1',
  studyType: 'RX',
  bodyPart: 'Tórax',
  reason: 'Tos persistente',
  clinicalNotes: 'Paciente con síntomas respiratorios',
}

export const validClinic = {
  name: 'Clínica Medical',
  rfc: 'CME210101ABC',
  address: 'Av. Médica 456',
  phone: '5555001000',
  email: 'contacto@clinicamedical.com',
}

export const validDoctor = {
  name: 'Dra. Ana García',
  email: 'ana.garcia@clinic.com',
  role: 'DOCTOR' as const,
  specialty: 'Medicina General',
  licenseNumber: '12345678',
  phone: '5551234567',
}

export const validUser = {
  name: 'Usuario Prueba',
  email: 'test@example.com',
  role: 'ADMIN' as const,
}

export const generateFakerPatient = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  middleName: faker.person.middleName(),
  curp: generateCurp(),
  birthDate: faker.date.birthdate().toISOString().split('T')[0],
  gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
  bloodType: faker.helpers.arrayElement(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  mobile: faker.phone.number(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  zipCode: faker.location.zipCode(),
})

export const generateFakerAppointment = (patientId: string, doctorId: string) => {
  const startTime = faker.date.future()
  return {
    patientId,
    doctorId,
    startTime: startTime.toISOString(),
    endTime: new Date(startTime.getTime() + 30 * 60 * 1000).toISOString(),
    status: faker.helpers.arrayElement(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    reason: faker.lorem.sentence(),
    notes: faker.lorem.paragraph(),
  }
}
