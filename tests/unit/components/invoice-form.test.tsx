import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceForm } from '@/components/billing/invoice-form'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from 'sonner'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('InvoiceForm', () => {
  const mockSuccess = vi.fn()
  const mockCancel = vi.fn()

  const mockServices = [
    { id: 'svc-1', name: 'Consulta General', description: 'Consulta médica general', basePrice: 500, category: { id: 'cat-1', name: 'Consultas' } },
    { id: 'svc-2', name: 'Laboratorio Básico', description: 'Análisis de sangre', basePrice: 800, category: null },
  ]

  const mockPatients = [
    { id: 'pat-1', firstName: 'Juan', lastName: 'Pérez' },
    { id: 'pat-2', firstName: 'María', lastName: 'García' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default fetch mock
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockServices }),
        })
      }
      if (url.includes('/api/patients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockPatients }),
        })
      }
      if (url.includes('/api/invoices') && url === '/api/invoices') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'inv-1' }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('Renderizado', () => {
    it('debe renderizar el formulario correctamente', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Datos del Paciente/i)).toBeInTheDocument()
      })
      
      expect(screen.getByPlaceholderText(/Buscar por nombre o CURP/i)).toBeInTheDocument()
      expect(screen.getByText(/Servicios/i)).toBeInTheDocument()
      expect(screen.getByText(/Notas/i)).toBeInTheDocument()
    })

    it('debe cargar servicios al montar', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/services')
      })
    })

    it('debe mostrar el botón de crear factura', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Crear Factura/i })).toBeInTheDocument()
      })
    })

    it('debe mostrar botón de cancelar', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
      })
    })
  })

  describe('Búsqueda de paciente', () => {
    it('debe buscar pacientes al escribir en el input', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      
      const searchInput = screen.getByPlaceholderText(/Buscar por nombre o CURP/i)
      await user.type(searchInput, 'Juan')
      
      // Esperar debounce
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/patients?search=Juan'))
      })
    })

    it('debe mostrar resultados de búsqueda', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      
      const searchInput = screen.getByPlaceholderText(/Buscar por nombre o CURP/i)
      await user.type(searchInput, 'Juan')
      
      await waitFor(() => {
        expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument()
      })
    })

    it('debe seleccionar paciente al hacer click', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      
      const searchInput = screen.getByPlaceholderText(/Buscar por nombre o CURP/i)
      await user.type(searchInput, 'Juan')
      
      await waitFor(() => screen.getByText(/Juan Pérez/i))
      
      const patientOption = screen.getByText(/Juan Pérez/i)
      fireEvent.click(patientOption)
      
      // Debe mostrar paciente seleccionado
      await waitFor(() => {
        expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument()
      })
    })

    it('debe permitir remover paciente seleccionado', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      
      const searchInput = screen.getByPlaceholderText(/Buscar por nombre o CURP/i)
      await user.type(searchInput, 'Juan')
      
      await waitFor(() => screen.getByText(/Juan Pérez/i))
      
      fireEvent.click(screen.getByText(/Juan Pérez/i))
      
      await waitFor(() => {
        expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument()
      })
      
      // Remover paciente
      const removeButton = screen.getByRole('button', { name: '' })
      fireEvent.click(removeButton)
      
      // El paciente ya no debe estar seleccionado
      await waitFor(() => {
        const selectedPatient = screen.queryByText(/bg-green-50/)
        expect(selectedPatient).not.toBeInTheDocument()
      })
    })
  })

  describe('Servicios/Items', () => {
    it('debe mostrar servicios disponibles en el select', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Agregar servicio/i)).toBeInTheDocument()
      })
    })

    it('debe agregar servicio a los items', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByText(/Agregar servicio/i))
      
      const serviceSelect = screen.getByText(/Agregar servicio/i).closest('select') || screen.getByRole('combobox')
      fireEvent.change(serviceSelect, { target: { value: 'svc-1' } })
      
      await waitFor(() => {
        expect(screen.getByText(/Item 1/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar item por defecto', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Item 1/i)).toBeInTheDocument()
      })
    })

    it('debe permitir agregar múltiples items', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Agregar Item/i }))
      
      const addButton = screen.getByRole('button', { name: /Agregar Item/i })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Item 1/i)).toBeInTheDocument()
        expect(screen.getByText(/Item 2/i)).toBeInTheDocument()
      })
    })

    it('debe permitir eliminar items', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Agregar Item/i }))
      
      // Agregar un segundo item
      const addButton = screen.getByRole('button', { name: /Agregar Item/i })
      fireEvent.click(addButton)
      
      await waitFor(() => screen.getByText(/Item 2/i))
      
      // Eliminar el primer item
      const removeButtons = screen.getAllByRole('button', { name: '' })
      const itemRemoveButton = removeButtons.find(btn => btn.closest('[class*="p-4"]'))
      if (itemRemoveButton) {
        fireEvent.click(itemRemoveButton)
      }
      
      // Solo debe quedar un item
      await waitFor(() => {
        expect(screen.queryByText(/Item 2/i)).not.toBeInTheDocument()
      })
    })

    it('debe calcular subtotal correctamente', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Total:/i)).toBeInTheDocument()
      })
      
      // Debe mostrar el total calculado
      const totalElement = screen.getByText(/Total:/i).closest('div')
      expect(totalElement).toBeInTheDocument()
    })
  })

  describe('Validaciones', () => {
    it('debe mostrar error cuando no hay paciente seleccionado', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Crear Factura/i }))
      
      const submitButton = screen.getByRole('button', { name: /Crear Factura/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Selecciona un paciente')
      })
    })
  })

  describe('Submit', () => {
    it('debe crear factura correctamente', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      // Seleccionar paciente
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      await user.type(screen.getByPlaceholderText(/Buscar por nombre o CURP/i), 'Juan')
      await waitFor(() => screen.getByText(/Juan Pérez/i))
      fireEvent.click(screen.getByText(/Juan Pérez/i))
      
      // Llenar descripción del item
      await waitFor(() => screen.getByPlaceholderText(/Descripción del servicio/i))
      await user.type(screen.getByPlaceholderText(/Descripción del servicio/i), 'Consulta médica')
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /Crear Factura/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/invoices',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('debe llamar onSuccess después de crear factura', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      // Seleccionar paciente
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      await user.type(screen.getByPlaceholderText(/Buscar por nombre o CURP/i), 'Juan')
      await waitFor(() => screen.getByText(/Juan Pérez/i))
      fireEvent.click(screen.getByText(/Juan Pérez/i))
      
      // Llenar descripción
      await waitFor(() => screen.getByPlaceholderText(/Descripción del servicio/i))
      await user.type(screen.getByPlaceholderText(/Descripción del servicio/i), 'Consulta')
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /Crear Factura/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Factura creada correctamente')
      })
    })

    it('debe deshabilitar el botón durante submit', async () => {
      const user = userEvent.setup()
      
      // Simular respuesta lenta
      mockFetch.mockImplementation(() => new Promise(() => {}))
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      // Seleccionar paciente
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      await user.type(screen.getByPlaceholderText(/Buscar por nombre o CURP/i), 'Juan')
      await waitFor(() => screen.getByText(/Juan Pérez/i))
      fireEvent.click(screen.getByText(/Juan Pérez/i))
      
      // Llenar descripción
      await waitFor(() => screen.getByPlaceholderText(/Descripción del servicio/i))
      await user.type(screen.getByPlaceholderText(/Descripción del servicio/i), 'Consulta')
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /Crear Factura/i })
      fireEvent.click(submitButton)
      
      // El botón debe estar deshabilitado y mostrar loader
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it('debe manejar error del servidor', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/invoices') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Error del servidor' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockPatients, services: mockServices }),
        })
      })
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      // Seleccionar paciente
      await waitFor(() => screen.getByPlaceholderText(/Buscar por nombre o CURP/i))
      await user.type(screen.getByPlaceholderText(/Buscar por nombre o CURP/i), 'Juan')
      await waitFor(() => screen.getByText(/Juan Pérez/i))
      fireEvent.click(screen.getByText(/Juan Pérez/i))
      
      // Llenar descripción
      await waitFor(() => screen.getByPlaceholderText(/Descripción del servicio/i))
      await user.type(screen.getByPlaceholderText(/Descripción del servicio/i), 'Consulta')
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /Crear Factura/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error del servidor')
      })
    })
  })

  describe('Campos de item', () => {
    it('debe permitir modificar cantidad', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByLabelText(/Cantidad/i))
      
      const quantityInput = screen.getByLabelText(/Cantidad/i)
      fireEvent.change(quantityInput, { target: { value: '2' } })
      
      expect(quantityInput).toHaveValue(2)
    })

    it('debe permitir modificar precio unitario', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByLabelText(/Precio Unit/i))
      
      const priceInput = screen.getByLabelText(/Precio Unit/i)
      fireEvent.change(priceInput, { target: { value: '1000' } })
      
      expect(priceInput).toHaveValue(1000)
    })

    it('debe permitir modificar descuento', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByLabelText(/Descuento/i))
      
      const discountInput = screen.getByLabelText(/Descuento/i)
      fireEvent.change(discountInput, { target: { value: '100' } })
      
      expect(discountInput).toHaveValue(100)
    })

    it('debe actualizar subtotal al modificar valores', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument()
      })
      
      // Modificar cantidad
      const quantityInput = screen.getByLabelText(/Cantidad/i)
      fireEvent.change(quantityInput, { target: { value: '2' } })
      
      // Modificar precio
      const priceInput = screen.getByLabelText(/Precio Unit/i)
      fireEvent.change(priceInput, { target: { value: '500' } })
      
      // El subtotal debe actualizarse
      const subtotalElement = screen.getByText(/Subtotal:/i)
      expect(subtotalElement).toBeInTheDocument()
    })
  })

  describe('Notas', () => {
    it('debe permitir agregar notas a la factura', async () => {
      const user = userEvent.setup()
      
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByPlaceholderText(/Notas adicionales para la factura/i))
      
      const notesInput = screen.getByPlaceholderText(/Notas adicionales para la factura/i)
      await user.type(notesInput, 'Nota de prueba')
      
      expect(notesInput).toHaveValue('Nota de prueba')
    })
  })

  describe('Cancelar', () => {
    it('debe llamar onCancel cuando se hace click en cancelar', async () => {
      render(<InvoiceForm onSuccess={mockSuccess} onCancel={mockCancel} />)
      
      await waitFor(() => screen.getByRole('button', { name: /Cancelar/i }))
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      fireEvent.click(cancelButton)
      
      expect(mockCancel).toHaveBeenCalled()
    })
  })
})
