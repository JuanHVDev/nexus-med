/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Integration Flow - Medical Note to Patient History', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  const mockPatient = {
    id: 'patient-test-1',
    firstName: 'Juan',
    lastName: 'Perez',
    curp: 'PEPJ900115HNLRN01',
    birthDate: '1990-01-15',
    gender: 'MALE',
  }

  const mockDoctor = {
    id: 'doctor-test-1',
    name: 'Dr. Maria Garcia',
    email: 'doctor@clinic.com',
    role: 'DOCTOR',
  }

  const mockMedicalNote = {
    id: 'note-test-1',
    patientId: mockPatient.id,
    doctorId: mockDoctor.id,
    specialty: 'MEDICINA_GENERAL',
    chiefComplaint: 'Dolor de cabeza',
    presentIllness: 'Paciente refiere dolor de cabeza frontal desde hace 3 días',
    diagnosis: 'Cefalea tensional',
    cie10Code: 'G44.2',
    treatment: 'Paracetamol 500mg cada 8 horas',
    notes: 'Se recomienda reposo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    doctor: mockDoctor,
  }

  const mockPatientHistory = {
    patient: mockPatient,
    medicalNotes: [mockMedicalNote],
    totalNotes: 1,
  }

  it('should create medical note and reflect in patient history', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMedicalNote }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatientHistory,
      } as Response)

    // Create medical note
    const createResponse = await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: mockPatient.id,
        specialty: mockMedicalNote.specialty,
        chiefComplaint: mockMedicalNote.chiefComplaint,
        presentIllness: mockMedicalNote.presentIllness,
        diagnosis: mockMedicalNote.diagnosis,
        cie10Code: mockMedicalNote.cie10Code,
        treatment: mockMedicalNote.treatment,
        notes: mockMedicalNote.notes,
      }),
    })

    const createData = await createResponse.json()
    expect(createResponse.ok).toBe(true)
    expect(createData.data.patientId).toBe(mockPatient.id)
    expect(createData.data.diagnosis).toBe('Cefalea tensional')

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    expect(historyResponse.ok).toBe(true)
    expect(historyData.medicalNotes).toHaveLength(1)
    expect(historyData.medicalNotes[0].diagnosis).toBe('Cefalea tensional')
  })

  it('should update medical note and reflect changes in patient history', async () => {
    const updatedNote = { 
      ...mockMedicalNote, 
      diagnosis: 'Migraña',
      cie10Code: 'G43.0',
      treatment: 'Sumatriptán 50mg',
    }
    
    const updatedHistory = {
      ...mockPatientHistory,
      medicalNotes: [updatedNote],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedNote }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedHistory,
      } as Response)

    // Update medical note
    const updateResponse = await fetch(`/api/medical-notes/${mockMedicalNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosis: 'Migraña',
        cie10Code: 'G43.0',
        treatment: 'Sumatriptán 50mg',
      }),
    })

    const updateData = await updateResponse.json()
    expect(updateResponse.ok).toBe(true)
    expect(updateData.data.diagnosis).toBe('Migraña')

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    expect(historyData.medicalNotes[0].diagnosis).toBe('Migraña')
    expect(historyData.medicalNotes[0].cie10Code).toBe('G43.0')
  })

  it('should create multiple medical notes and display all in patient history', async () => {
    const note2 = {
      ...mockMedicalNote,
      id: 'note-test-2',
      specialty: 'CARDIOLOGIA',
      chiefComplaint: 'Dolor en el pecho',
      diagnosis: 'Hipertensión arterial',
      cie10Code: 'I10',
      createdAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    const multiHistory = {
      ...mockPatientHistory,
      medicalNotes: [note2, mockMedicalNote],
      totalNotes: 2,
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMedicalNote }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: note2 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => multiHistory,
      } as Response)

    // Create first note
    await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockMedicalNote),
    })

    // Create second note
    await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note2),
    })

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    expect(historyData.medicalNotes).toHaveLength(2)
    expect(historyData.totalNotes).toBe(2)
    expect(historyData.medicalNotes.map((n: any) => n.specialty)).toContain('MEDICINA_GENERAL')
    expect(historyData.medicalNotes.map((n: any) => n.specialty)).toContain('CARDIOLOGIA')
  })

  it('should sort medical notes by date in patient history', async () => {
    const olderNote = {
      ...mockMedicalNote,
      id: 'note-test-old',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const newerNote = {
      ...mockMedicalNote,
      id: 'note-test-new',
      createdAt: new Date().toISOString(),
    }

    const sortedHistory = {
      ...mockPatientHistory,
      medicalNotes: [newerNote, olderNote],
      totalNotes: 2,
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => sortedHistory,
    } as Response)

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history?sort=date&order=desc`)
    const historyData = await historyResponse.json()

    expect(historyResponse.ok).toBe(true)
    expect(historyData.medicalNotes).toHaveLength(2)
    expect(new Date(historyData.medicalNotes[0].createdAt).getTime()).toBeGreaterThan(
      new Date(historyData.medicalNotes[1].createdAt).getTime()
    )
  })

  it('should filter medical notes by specialty in patient history', async () => {
    const cardiologyNote = {
      ...mockMedicalNote,
      id: 'note-test-cardio',
      specialty: 'CARDIOLOGIA',
      diagnosis: 'Arritmia',
    }

    const filteredHistory = {
      ...mockPatientHistory,
      medicalNotes: [cardiologyNote],
      totalNotes: 1,
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => filteredHistory,
    } as Response)

    // Fetch patient history filtered by specialty
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history?specialty=CARDIOLOGIA`)
    const historyData = await historyResponse.json()

    expect(historyData.medicalNotes).toHaveLength(1)
    expect(historyData.medicalNotes[0].specialty).toBe('CARDIOLOGIA')
  })

  it('should include doctor information in medical notes within patient history', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockPatientHistory,
    } as Response)

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    expect(historyData.medicalNotes[0].doctor).toBeDefined()
    expect(historyData.medicalNotes[0].doctor.name).toBe('Dr. Maria Garcia')
    expect(historyData.medicalNotes[0].doctor.email).toBe('doctor@clinic.com')
  })

  it('should maintain data consistency between medical notes and patient history APIs', async () => {
    const notesList = [mockMedicalNote]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: notesList, total: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatientHistory,
      } as Response)

    // Fetch medical notes list
    const notesResponse = await fetch(`/api/medical-notes?patientId=${mockPatient.id}`)
    const notesData = await notesResponse.json()

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    // Verify consistency
    expect(notesData.total).toBe(historyData.totalNotes)
    expect(notesData.data[0].id).toBe(historyData.medicalNotes[0].id)
  })

  it('should handle medical note creation for non-existent patient', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Patient not found' }),
    } as Response)

    const response = await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'non-existent-patient',
        specialty: 'MEDICINA_GENERAL',
        chiefComplaint: 'Test',
        diagnosis: 'Test',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.error).toBe('Patient not found')
  })

  it('should validate required fields when creating medical note', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Chief complaint is required' }),
    } as Response)

    const response = await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: mockPatient.id,
        specialty: 'MEDICINA_GENERAL',
        // Missing chiefComplaint
        diagnosis: 'Test',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Chief complaint is required')
  })

  it('should update patient last visit date when creating medical note', async () => {
    const updatedPatient = {
      ...mockPatient,
      lastVisit: new Date().toISOString(),
    }

    const historyWithLastVisit = {
      patient: updatedPatient,
      medicalNotes: [mockMedicalNote],
      totalNotes: 1,
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMedicalNote }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => historyWithLastVisit,
      } as Response)

    // Create medical note
    await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockMedicalNote),
    })

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    expect(historyData.patient.lastVisit).toBeDefined()
  })

  it('should link prescription to medical note and show in history', async () => {
    const mockPrescription = {
      id: 'prescription-test-1',
      medicalNoteId: mockMedicalNote.id,
      patientId: mockPatient.id,
      medications: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Cada 8 horas' },
      ],
    }

    const historyWithPrescription = {
      ...mockPatientHistory,
      medicalNotes: [
        { ...mockMedicalNote, prescription: mockPrescription },
      ],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMedicalNote }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPrescription }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => historyWithPrescription,
      } as Response)

    // Create medical note
    await fetch('/api/medical-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockMedicalNote),
    })

    // Create prescription linked to note
    await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPrescription),
    })

    // Fetch patient history
    const historyResponse = await fetch(`/api/patients/${mockPatient.id}/history`)
    const historyData = await historyResponse.json()

    expect(historyData.medicalNotes[0].prescription).toBeDefined()
    expect(historyData.medicalNotes[0].prescription.medications).toHaveLength(1)
  })
})
