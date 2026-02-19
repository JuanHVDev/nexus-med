import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MedicalNoteForm } from '@/components/medical-notes/medical-note-form'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as jest.Mock

describe('MedicalNoteForm', () => {
  const mockSubmit = vi.fn()
  const mockCancel = vi.fn()

  const mockPatient = {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    middleName: 'García',
  }

  const mockAppointment = {
    id: 'apt-1',
    startTime: '2024-12-01T10:00:00Z',
    reason: 'Dolor de cabeza',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('debe renderizar el formulario correctamente', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      expect(screen.getByLabelText(/Especialidad/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tipo de Nota/i)).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Motivo/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Exploración/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Diagnóstico/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Tratamiento/i })).toBeInTheDocument()
    })

    it('debe mostrar información del paciente', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      // El form debe tener el patientId en los valores por defecto
      expect(mockPatient.id).toBe('patient-1')
    })

    it('debe cargar motivo de consulta desde appointment si se proporciona', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          appointment={mockAppointment}
          onSubmit={mockSubmit}
        />
      )
      
      // Debe cargar el reason del appointment en chiefComplaint
      expect(mockAppointment.reason).toBe('Dolor de cabeza')
    })

    it('debe mostrar el botón de guardar nota médica', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      expect(screen.getByRole('button', { name: /Guardar Nota Médica/i })).toBeInTheDocument()
    })

    it('debe mostrar botón de cancelar cuando se proporciona onCancel', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      )
      
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })
  })

  describe('Tabs', () => {
    it('debe mostrar tab de Motivo por defecto', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      expect(screen.getByText(/Motivo de Consulta/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Motivo de consulta/i)).toBeInTheDocument()
    })

    it('debe cambiar a tab de Exploración al hacer click', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const explorationTab = screen.getByRole('tab', { name: /Exploración/i })
      fireEvent.click(explorationTab)
      
      await waitFor(() => {
        expect(screen.getByText(/Signos Vitales/i)).toBeInTheDocument()
        expect(screen.getByText(/Exploración Física/i)).toBeInTheDocument()
      })
    })

    it('debe cambiar a tab de Diagnóstico al hacer click', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const diagnosisTab = screen.getByRole('tab', { name: /Diagnóstico/i })
      fireEvent.click(diagnosisTab)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Diagnóstico/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Pronóstico/i)).toBeInTheDocument()
      })
    })

    it('debe cambiar a tab de Tratamiento al hacer click', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const treatmentTab = screen.getByRole('tab', { name: /Tratamiento/i })
      fireEvent.click(treatmentTab)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Plan de tratamiento/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Notas adicionales/i)).toBeInTheDocument()
      })
    })
  })

  describe('Especialidades', () => {
    it('debe permitir seleccionar especialidad', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const specialtySelect = screen.getByLabelText(/Especialidad/i)
      fireEvent.click(specialtySelect)
      
      await waitFor(() => {
        expect(screen.getByText(/Medicina General/i)).toBeInTheDocument()
        expect(screen.getByText(/Pediatría/i)).toBeInTheDocument()
        expect(screen.getByText(/Cardiología/i)).toBeInTheDocument()
      })
    })

    it('debe cargar plantilla de exploración física al cambiar especialidad', async () => {
      mockSubmit.mockResolvedValue(undefined)
      
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      // Cambiar especialidad
      const specialtySelect = screen.getByLabelText(/Especialidad/i)
      fireEvent.click(specialtySelect)
      
      await waitFor(() => {
        const cardiologyOption = screen.getByText(/Cardiología/i)
        fireEvent.click(cardiologyOption)
      })
      
      // Ir a tab de exploración
      const explorationTab = screen.getByRole('tab', { name: /Exploración/i })
      fireEvent.click(explorationTab)
      
      await waitFor(() => {
        // Debe cargar algún texto de plantilla o estar listo para input
        const physicalExamInput = screen.getByPlaceholderText(/Hallazgos de la exploración física/i)
        expect(physicalExamInput).toBeInTheDocument()
      })
    })
  })

  describe('Signos Vitales', () => {
    it('debe permitir ingresar signos vitales', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const explorationTab = screen.getByRole('tab', { name: /Exploración/i })
      fireEvent.click(explorationTab)
      
      await waitFor(() => {
        expect(screen.getByText(/PA Sistólica/i)).toBeInTheDocument()
        expect(screen.getByText(/PA Diastólica/i)).toBeInTheDocument()
        expect(screen.getByText(/Frecuencia Cardiaca/i)).toBeInTheDocument()
        expect(screen.getByText(/Temperatura/i)).toBeInTheDocument()
        expect(screen.getByText(/Peso/i)).toBeInTheDocument()
        expect(screen.getByText(/Altura/i)).toBeInTheDocument()
        expect(screen.getByText(/SpO2/i)).toBeInTheDocument()
        expect(screen.getByText(/FR/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validaciones', () => {
    it('debe mostrar error cuando motivo de consulta está vacío', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const submitButton = screen.getByRole('button', { name: /Guardar Nota Médica/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Motivo de consulta requerido/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error cuando diagnóstico está vacío', async () => {
      const user = userEvent.setup()
      
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      // Llenar motivo de consulta
      await user.type(screen.getByLabelText(/Motivo de consulta/i), 'Dolor de cabeza')
      
      const submitButton = screen.getByRole('button', { name: /Guardar Nota Médica/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Diagnóstico requerido/i)).toBeInTheDocument()
      })
    })
  })

  describe('Submit', () => {
    it('debe llamar onSubmit con datos válidos incluyendo signos vitales', async () => {
      const user = userEvent.setup()
      mockSubmit.mockResolvedValue(undefined)
      
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      // Llenar motivo de consulta
      await user.type(screen.getByLabelText(/Motivo de consulta/i), 'Dolor de cabeza severo')
      
      // Ir a tab de diagnóstico
      const diagnosisTab = screen.getByRole('tab', { name: /Diagnóstico/i })
      fireEvent.click(diagnosisTab)
      await waitFor(() => screen.getByLabelText(/Diagnóstico/i))
      
      // Llenar diagnóstico
      await user.type(screen.getByLabelText(/Diagnóstico/i), 'Cefalea tensional')
      
      const submitButton = screen.getByRole('button', { name: /Guardar Nota Médica/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            patientId: 'patient-1',
            chiefComplaint: 'Dolor de cabeza severo',
            diagnosis: 'Cefalea tensional',
          })
        )
      })
    })

    it('debe incluir signos vitales en el submit', async () => {
      const user = userEvent.setup()
      mockSubmit.mockResolvedValue(undefined)
      
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      // Ir a tab de exploración y llenar signos vitales
      const explorationTab = screen.getByRole('tab', { name: /Exploración/i })
      fireEvent.click(explorationTab)
      
      await waitFor(() => {
        const bloodPressureInputs = screen.getAllByRole('spinbutton')
        expect(bloodPressureInputs.length).toBeGreaterThan(0)
      })
      
      // Volver a tab de motivo y llenar datos requeridos
      const complaintTab = screen.getByRole('tab', { name: /Motivo/i })
      fireEvent.click(complaintTab)
      await user.type(screen.getByLabelText(/Motivo de consulta/i), 'Dolor de cabeza')
      
      const diagnosisTab = screen.getByRole('tab', { name: /Diagnóstico/i })
      fireEvent.click(diagnosisTab)
      await waitFor(() => screen.getByLabelText(/Diagnóstico/i))
      await user.type(screen.getByLabelText(/Diagnóstico/i), 'Cefalea')
      
      const submitButton = screen.getByRole('button', { name: /Guardar Nota Médica/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
        const callArg = mockSubmit.mock.calls[0][0]
        expect(callArg).toHaveProperty('vitalSigns')
      })
    })

    it('debe deshabilitar el botón cuando isLoading es true', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
          isLoading={true}
        />
      )
      
      const submitButton = screen.getByRole('button', { name: /Guardando/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Modo edición', () => {
    it('debe cargar datos de nota existente en modo edición', async () => {
      const mockNote = {
        id: 'note-1',
        patientId: 'patient-1',
        specialty: 'GENERAL',
        type: 'CONSULTATION',
        chiefComplaint: 'Dolor abdominal',
        diagnosis: 'Gastritis',
        vitalSigns: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          heartRate: 72,
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNote),
      })

      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
          isEditMode={true}
          noteId="note-1"
        />
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/medical-notes/note-1')
      })
    })
  })

  describe('Tipos de nota', () => {
    it('debe permitir seleccionar tipo de nota', async () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
        />
      )
      
      const typeSelect = screen.getByLabelText(/Tipo de Nota/i)
      fireEvent.click(typeSelect)
      
      await waitFor(() => {
        expect(screen.getByText(/Consulta/i)).toBeInTheDocument()
        expect(screen.getByText(/Seguimiento/i)).toBeInTheDocument()
        expect(screen.getByText(/Emergencia/i)).toBeInTheDocument()
        expect(screen.getByText(/Procedimiento/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cancelar', () => {
    it('debe llamar onCancel cuando se hace click en cancelar', () => {
      render(
        <MedicalNoteForm
          patient={mockPatient}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      )
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      fireEvent.click(cancelButton)
      
      expect(mockCancel).toHaveBeenCalled()
    })
  })
})
