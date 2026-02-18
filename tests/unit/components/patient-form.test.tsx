import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatientForm } from '@/components/patients/patient-form'

describe('PatientForm', () => {
  const mockSubmit = vi.fn()
  const mockCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('debe renderizar el formulario correctamente', () => {
      render(<PatientForm onSubmit={mockSubmit} />)
      
      expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Apellido Paterno/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Apellido Materno/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/CURP/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Fecha de Nacimiento/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Género/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tipo de Sangre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Dirección/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Ciudad/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Código Postal/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Notas/i)).toBeInTheDocument()
    })

    it('debe mostrar el botón de crear paciente por defecto', () => {
      render(<PatientForm onSubmit={mockSubmit} />)
      
      expect(screen.getByRole('button', { name: /Crear Paciente/i })).toBeInTheDocument()
    })

    it('debe mostrar el botón de actualizar paciente en modo edit', () => {
      render(<PatientForm onSubmit={mockSubmit} mode="edit" />)
      
      expect(screen.getByRole('button', { name: /Actualizar Paciente/i })).toBeInTheDocument()
    })

    it('debe mostrar botón de cancelar cuando se proporciona onCancel', () => {
      render(<PatientForm onSubmit={mockSubmit} onCancel={mockCancel} />)
      
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    })
  })

  describe('Validaciones', () => {
    it('debe mostrar error cuando nombre está vacío en modo create', async () => {
      render(<PatientForm onSubmit={mockSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /Crear Paciente/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error cuando apellido paterno está vacío en modo create', async () => {
      render(<PatientForm onSubmit={mockSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /Crear Paciente/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Apellido debe tener al menos 2 caracteres/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error cuando fecha de nacimiento está vacía en modo create', async () => {
      render(<PatientForm onSubmit={mockSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /Crear Paciente/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Fecha de nacimiento requerida/i)).toBeInTheDocument()
      })
    })

    it('debe validar formato de CURP correctamente', async () => {
      const user = userEvent.setup()
      render(<PatientForm onSubmit={mockSubmit} />)
      
      const curpInput = screen.getByPlaceholderText(/XAXX010101HNEXXXA1/i)
      await user.type(curpInput, 'INVALID')
      
      const submitButton = screen.getByRole('button', { name: /Crear Paciente/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/CURP inválida/i)).toBeInTheDocument()
      })
    })

    it('debe aceptar CURP válida', async () => {
      const user = userEvent.setup()
      render(<PatientForm onSubmit={mockSubmit} />)
      
      const curpInput = screen.getByPlaceholderText(/XAXX010101HNEXXXA1/i)
      await user.type(curpInput, 'XAXX010101HNEXXXA1')
      
      // No debería mostrar error de CURP
      expect(screen.queryByText(/CURP inválida/i)).not.toBeInTheDocument()
    })
  })

  describe('Submit', () => {
    it('debe llamar onSubmit con datos válidos', async () => {
      const user = userEvent.setup()
      mockSubmit.mockResolvedValue(undefined)
      
      render(<PatientForm onSubmit={mockSubmit} />)
      
      // Llenar campos obligatorios
      await user.type(screen.getByLabelText(/Nombre/i), 'Juan')
      await user.type(screen.getByLabelText(/Apellido Paterno/i), 'Pérez')
      
      const birthDateInput = screen.getByLabelText(/Fecha de Nacimiento/i)
      fireEvent.change(birthDateInput, { target: { value: '1990-01-01' } })
      
      // Seleccionar género
      const genderSelect = screen.getByLabelText(/Género/i)
      fireEvent.click(genderSelect)
      await waitFor(() => {
        const maleOption = screen.getByText(/Masculino/i)
        fireEvent.click(maleOption)
      })
      
      const submitButton = screen.getByRole('button', { name: /Crear Paciente/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })

    it('debe deshabilitar el botón cuando isLoading es true', () => {
      render(<PatientForm onSubmit={mockSubmit} isLoading={true} />)
      
      const submitButton = screen.getByRole('button', { name: /Guardando/i })
      expect(submitButton).toBeDisabled()
    })

    it('debe mostrar texto de carga cuando isLoading es true', () => {
      render(<PatientForm onSubmit={mockSubmit} isLoading={true} />)
      
      expect(screen.getByRole('button', { name: /Guardando/i })).toBeInTheDocument()
    })
  })

  describe('Valores por defecto', () => {
    it('debe cargar valores por defecto correctamente', () => {
      const defaultValues = {
        firstName: 'María',
        lastName: 'García',
        middleName: 'López',
        curp: 'GALM900101MDFXXX01',
        email: 'maria@email.com',
        phone: '5512345678',
      }
      
      render(<PatientForm onSubmit={mockSubmit} defaultValues={defaultValues} mode="edit" />)
      
      expect(screen.getByDisplayValue('María')).toBeInTheDocument()
      expect(screen.getByDisplayValue('García')).toBeInTheDocument()
      expect(screen.getByDisplayValue('López')).toBeInTheDocument()
      expect(screen.getByDisplayValue('GALM900101MDFXXX01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('maria@email.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('5512345678')).toBeInTheDocument()
    })
  })

  describe('Campos opcionales', () => {
    it('debe permitir dejar campos opcionales vacíos', async () => {
      const user = userEvent.setup()
      mockSubmit.mockResolvedValue(undefined)
      
      render(<PatientForm onSubmit={mockSubmit} />)
      
      // Solo llenar campos obligatorios
      await user.type(screen.getByLabelText(/Nombre/i), 'Juan')
      await user.type(screen.getByLabelText(/Apellido Paterno/i), 'Pérez')
      
      const birthDateInput = screen.getByLabelText(/Fecha de Nacimiento/i)
      fireEvent.change(birthDateInput, { target: { value: '1990-01-01' } })
      
      // Seleccionar género
      const genderSelect = screen.getByLabelText(/Género/i)
      fireEvent.click(genderSelect)
      await waitFor(() => {
        const maleOption = screen.getByText(/Masculino/i)
        fireEvent.click(maleOption)
      })
      
      const submitButton = screen.getByRole('button', { name: /Crear Paciente/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Cancelar', () => {
    it('debe llamar onCancel cuando se hace click en cancelar', async () => {
      render(<PatientForm onSubmit={mockSubmit} onCancel={mockCancel} />)
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      fireEvent.click(cancelButton)
      
      expect(mockCancel).toHaveBeenCalled()
    })
  })
})
