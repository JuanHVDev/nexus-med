import { prisma } from "@/lib/prisma"
import type {
  PatientListItem,
  PatientDetail,
  PatientFilters,
  PatientListResult,
  CreatePatientInput,
  UpdatePatientInput,
  MedicalHistory,
  EmergencyContact,
  UpdateMedicalHistoryInput,
  CreateEmergencyContactInput,
  Gender,
  BloodType,
  PatientNoteSimple,
} from "./types"

interface PrismaMedicalHistory {
  id: bigint
  patientId: bigint
  allergies: unknown
  currentMedications: unknown
  chronicDiseases: unknown
  surgeries: unknown
  familyHistory: string | null
  personalHistory: string | null
  smoking: unknown
  alcohol: unknown
  drugs: unknown
  exercise: unknown
  diet: unknown
  vitalSigns: unknown
  vitalSignsRecordedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface PrismaEmergencyContact {
  id: bigint
  patientId: bigint
  name: string
  relation: string | null
  phone: string | null
  email: string | null
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

function mapMedicalHistory(history: PrismaMedicalHistory): MedicalHistory {
  return {
    id: history.id.toString(),
    patientId: history.patientId.toString(),
    allergies: Array.isArray(history.allergies) ? history.allergies as string[] : [],
    currentMedications: Array.isArray(history.currentMedications) ? history.currentMedications as string[] : [],
    chronicDiseases: Array.isArray(history.chronicDiseases) ? history.chronicDiseases as string[] : [],
    surgeries: Array.isArray(history.surgeries) ? history.surgeries as string[] : [],
    familyHistory: history.familyHistory,
    personalHistory: history.personalHistory,
    smoking: Boolean(history.smoking),
    alcohol: Boolean(history.alcohol),
    drugs: Boolean(history.drugs),
    exercise: history.exercise as string | null,
    diet: history.diet as string | null,
    vitalSigns: history.vitalSigns as Record<string, unknown> | null,
    vitalSignsRecordedAt: history.vitalSignsRecordedAt,
    createdAt: history.createdAt,
    updatedAt: history.updatedAt,
  }
}

function mapEmergencyContact(contact: PrismaEmergencyContact): EmergencyContact {
  return {
    id: contact.id.toString(),
    patientId: contact.patientId.toString(),
    name: contact.name,
    relation: contact.relation ?? "",
    phone: contact.phone ?? "",
    email: contact.email,
    isPrimary: contact.isPrimary,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  }
}

interface PrismaPatient {
  id: bigint
  clinicId: bigint
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
  birthDate: Date | null
  gender: string | null
  bloodType: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  isActive: boolean
  deletedAt: Date | null
  notes: string | null
  photoUrl: string | null
  photoName: string | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
  medicalHistory: PrismaMedicalHistory | null
  emergencyContacts?: PrismaEmergencyContact[]
  _count?: { appointments: number; medicalNotes: number }
}

function mapPatientToListItem(patient: PrismaPatient): PatientListItem {
  return {
    id: patient.id.toString(),
    clinicId: patient.clinicId.toString(),
    firstName: patient.firstName,
    lastName: patient.lastName,
    middleName: patient.middleName,
    curp: patient.curp,
    birthDate: patient.birthDate ?? new Date(),
    gender: patient.gender as Gender,
    bloodType: patient.bloodType as BloodType | null,
    email: patient.email,
    phone: patient.phone,
    mobile: patient.mobile,
    address: patient.address,
    city: patient.city,
    state: patient.state,
    zipCode: patient.zipCode,
    isActive: patient.isActive,
    deletedAt: patient.deletedAt,
    notes: patient.notes,
    photoUrl: patient.photoUrl,
    photoName: patient.photoName,
    userId: patient.userId,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    medicalHistory: patient.medicalHistory ? mapMedicalHistory(patient.medicalHistory) : null,
  }
}

function mapPatientToDetail(patient: PrismaPatient): PatientDetail {
  return {
    ...mapPatientToListItem(patient),
    emergencyContacts: patient.emergencyContacts?.map(mapEmergencyContact) || [],
    _count: patient._count,
  }
}

export const patientRepository = {
  async findMany(
    clinicId: bigint,
    filters: PatientFilters,
    page: number,
    limit: number
  ): Promise<PatientListResult> {
    const where: Record<string, unknown> = { clinicId }

    if (!filters.includeDeleted) {
      where.deletedAt = null
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { curp: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ]
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { medicalHistory: true },
      }),
      prisma.patient.count({ where }),
    ])

    return {
      data: patients.map(mapPatientToListItem),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  },

  async findById(id: bigint, clinicId: bigint): Promise<PatientDetail | null> {
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        medicalHistory: true,
        emergencyContacts: true,
        _count: { select: { appointments: true, medicalNotes: true } },
      },
    })

    if (!patient) return null
    return mapPatientToDetail(patient)
  },

  async findByIdIncludingDeleted(
    id: bigint,
    clinicId: bigint
  ): Promise<PatientDetail | null> {
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId },
      include: {
        medicalHistory: true,
        emergencyContacts: true,
      },
    })

    if (!patient) return null
    return mapPatientToDetail(patient)
  },

  async findByCurp(curp: string, clinicId: bigint): Promise<{ id: bigint } | null> {
    const patient = await prisma.patient.findFirst({
      where: { curp, clinicId },
      select: { id: true },
    })
    return patient
  },

  async create(
    clinicId: bigint,
    data: CreatePatientInput
  ): Promise<PatientListItem> {
    const patient = await prisma.patient.create({
      data: {
        ...data,
        clinicId,
      },
      include: { medicalHistory: true },
    })

    return mapPatientToListItem(patient)
  },

  async update(id: bigint, data: UpdatePatientInput): Promise<PatientListItem> {
    const patient = await prisma.patient.update({
      where: { id },
      data,
      include: { medicalHistory: true },
    })

    return mapPatientToListItem(patient)
  },

  async softDelete(id: bigint): Promise<void> {
    await prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  },

  async restore(id: bigint): Promise<PatientListItem> {
    const patient = await prisma.patient.update({
      where: { id },
      data: { deletedAt: null },
      include: { medicalHistory: true },
    })

    return mapPatientToListItem(patient)
  },

  async getMedicalHistory(patientId: bigint): Promise<MedicalHistory | null> {
    const history = await prisma.medicalHistory.findUnique({
      where: { patientId },
    })

    if (!history) return null
    return mapMedicalHistory(history)
  },

  async upsertMedicalHistory(
    patientId: bigint,
    data: UpdateMedicalHistoryInput
  ): Promise<MedicalHistory> {
    const history = await prisma.medicalHistory.upsert({
      where: { patientId },
      update: data as never,
      create: { patientId, ...data } as never,
    })

    return mapMedicalHistory(history)
  },

  async getEmergencyContacts(patientId: bigint): Promise<EmergencyContact[]> {
    const contacts = await prisma.emergencyContact.findMany({
      where: { patientId },
      orderBy: { isPrimary: "desc" },
    })

    return contacts.map(mapEmergencyContact)
  },

  async createEmergencyContact(
    patientId: bigint,
    data: CreateEmergencyContactInput
  ): Promise<EmergencyContact> {
    const contact = await prisma.emergencyContact.create({
      data: {
        ...data,
        patientId,
      },
    })

    return mapEmergencyContact(contact)
  },

  async deleteEmergencyContact(contactId: bigint): Promise<void> {
    await prisma.emergencyContact.delete({
      where: { id: contactId },
    })
  },

  async clearPrimaryEmergencyContacts(patientId: bigint): Promise<void> {
    await prisma.emergencyContact.updateMany({
      where: { patientId, isPrimary: true },
      data: { isPrimary: false },
    })
  },

  async findEmergencyContact(contactId: bigint, patientId: bigint): Promise<EmergencyContact | null> {
    const contact = await prisma.emergencyContact.findFirst({
      where: { id: contactId, patientId },
    })

    if (!contact) return null
    return mapEmergencyContact(contact)
  },

  async getPatientNotes(patientId: bigint, clinicId: bigint): Promise<PatientNoteSimple[]> {
    const notes = await prisma.medicalNote.findMany({
      where: { patientId, clinicId },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    })

    return notes.map((note) => ({
      id: note.id.toString(),
      clinicId: note.clinicId.toString(),
      patientId: note.patientId.toString(),
      doctorId: note.doctorId,
      appointmentId: note.appointmentId?.toString() || null,
      specialty: note.specialty,
      type: note.type,
      chiefComplaint: note.chiefComplaint,
      currentIllness: note.currentIllness,
      vitalSigns: note.vitalSigns,
      physicalExam: note.physicalExam,
      diagnosis: note.diagnosis,
      prognosis: note.prognosis,
      treatment: note.treatment,
      notes: note.notes,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      doctor: note.doctor,
    }))
  },
}
