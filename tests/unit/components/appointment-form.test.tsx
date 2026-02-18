import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppointmentForm } from '@/components/appointments/appointment-form'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AppointmentForm', () => {
  const mockSubmit = vi.fn()
  const mockCancel = vi.fn()

  const mockPatients = [
    { id: '1', firstName: 'Juan', lastName: 'Pérez', phone: '5512345678' },
    { id: '2', firstName: 'María', lastName: 'García', middleName: 'López' },
  ]

  const mockDoctors = [
    { id: 'doc1', name: 'Dr. Carlos Ruiz', specialty: 'Medicina General' },
    { id: 'doc2', name: 'Dra. Ana Martínez', specialty: 'Cardiología' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default fetch mock
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/patients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockPatients }),
        })
      }
      if (url.includes('/api/users/doctors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockDoctors }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('Renderizado', () => {
    it('debe renderizar el formulario correctamente', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Paciente/i)).toBeInTheDocument()
      })
      
      expect(screen.getByLabelText(/Doctor/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha y hora de inicio/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha y hora de fin/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Motivo de la cita/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Notas adicionales/i)).toBeInTheDocument()
    })

    it('debe mostrar el botón de guardar cita', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Guardar cita/i })).toBeInTheDocument()
      })
    })

    it('debe mostrar botón de cancelar cuando se proporciona onCancel', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
      })
    })

    it('debe cargar pacientes al montar', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/patients?limit=1000')
      })
    })

    it('debe cargar doctores al montar', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/doctors')
      })
    })
  })

  describe('Validaciones', () => {
    it('debe mostrar error cuando paciente no está seleccionado', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Guardar cita/i }))
      
      const submitButton = screen.getByRole('button', { name: /Guardar cita/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Paciente requerido/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error cuando doctor no está seleccionado', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Guardar cita/i }))
      
      const submitButton = screen.getByRole('button', { name: /Guardar cita/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Doctor requerido/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error cuando fecha de inicio está vacía', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Guardar cita/i }))
      
      const submitButton = screen.getByRole('button', { name: /Guardar cita/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Fecha y hora de inicio requerida/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error cuando fecha de fin está vacía', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Guardar cita/i }))
      
      const submitButton = screen.getByRole('button', { name: /Guardar cita/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Fecha y hora de fin requerida/i)).toBeInTheDocument()
      })
    })
  })

  describe('Submit', () => {
    it('debe llamar onSubmit con datos válidos', async () => {
      const user = userEvent.setup()
      mockSubmit.mockResolvedValue(undefined)
      
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => screen.getByLabelText(/Paciente/i))
      
      // Seleccionar paciente
      const patientSelect = screen.getByLabelText(/Paciente/i)
      fireEvent.click(patientSelect)
      await waitFor(() => {
        const patientOption = screen.getByText(/Juan Pérez/i)
        fireEvent.click(patientOption)
      })
      
      // Seleccionar doctor
      const doctorSelect = screen.getByLabelText(/Doctor/i)
      fireEvent.click(doctorSelect)
      await waitFor(() => {
        const doctorOption = screen.getByText(/Dr. Carlos Ruiz/i)
        fireEvent.click(doctorOption)
      })
      
      // Establecer fechas
      const startTimeInput = screen.getByLabelText(/Fecha y hora de inicio/i)
      fireEvent.change(startTimeInput, { target: { value: '2024-12-01T10:00' } })
      
      const endTimeInput = screen.getByLabelText(/Fecha y hora de fin/i)
      fireEvent.change(endTimeInput, { target: { value: '2024-12-01T11:00' } })
      
      // Agregar motivo
      await user.type(screen.getByLabelText(/Motivo de la cita/i), 'Consulta general')
      
      const submitButton = screen.getByRole('button', { name: /Guardar cita/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })

    it('debe deshabilitar el botón cuando isLoading es true', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} isLoading={true} />)
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Guardando/i })
        expect(submitButton).toBeDisabled()
      })
    })

    it('debe mostrar texto de carga cuando isLoading es true', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} isLoading={true} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Guardando/i })).toBeInTheDocument()
      })
    })
  })

  describe('Estados', () => {
    it('debe permitir seleccionar diferentes estados', async () => {
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => screen.getByLabelText(/Estado/i))
      
      const statusSelect = screen.getByLabelText(/Estado/i)
      fireEvent.click(statusSelect)
      
      await waitFor(() => {
        expect(screen.getByText(/Programada/i)).toBeInTheDocument()
        expect(screen.getByText(/Confirmada/i)).toBeInTheDocument()
        expect(screen.getByText(/En progreso/i)).toBeInTheDocument()
        expect(screen.getByText(/Completada/i)).toBeInTheDocument()
        expect(screen.getByText(/Cancelada/i)).toBeInTheDocument()
        expect(screen.getByText(/No se presentó/i)).toBeInTheDocument()
      })
    })
  })

  describe('Valores por defecto', () => {
    it('debe cargar valores por defecto correctamente', async () => {
      const defaultValues = {
        patientId: '1',
        doctorId: 'doc1',
        startTime: '2024-12-01T10:00',
        endTime: '2024-12-01T11:00',
        status: 'CONFIRMED' as const,
        reason: 'Consulta de seguimiento',
        notes: 'Notas de prueba',
      }
      
      render(<AppointmentForm onSubmit={mockSubmit} defaultValues={defaultValues} />)
      
      await waitFor(() => screen.getByLabelText(/Motivo de la cita/i))
      
      expect(screen.getByDisplayValue('Consulta de seguimiento')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Notas de prueba')).toBeInTheDocument()
    })
  })

  describe('Manejo de errores', () => {
    it('debe manejar error al cargar pacientes', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/patients')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/api/users/doctors')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockDoctors }),
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('debe manejar error de respuesta no OK', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/patients')) {
          return Promise.resolve({
            ok: false,
            status: 500,
          })
        }
        if (url.includes('/api/users/doctors')) {
          return Promise.resolve({
            ok: false,
            status: 500,
          })
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      render(<AppointmentForm onSubmit={mockSubmit} />)
      
      // El componente debe seguir funcionando aunque falle la carga
      await waitFor(() => {
        expect(screen.getByLabelText(/Paciente/i)).toBeInTheDocument()
      })
    })
  })
})
