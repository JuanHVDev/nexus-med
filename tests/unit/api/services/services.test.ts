import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockCategories = [
  {
    id: '1',
    clinicId: '1',
    name: 'Consultas',
    description: 'Servicios de consulta medica',
    color: '#3b82f6',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: '2',
    clinicId: '1',
    name: 'Estudios de Laboratorio',
    description: 'Analisis clinicos',
    color: '#10b981',
    sortOrder: 2,
    isActive: true,
  },
]

const mockServices = [
  {
    id: '1',
    clinicId: '1',
    categoryId: '1',
    name: 'Consulta de Medicina General',
    description: 'Consulta inicial',
    basePrice: 500,
    duration: 30,
    isActive: true,
    category: { id: '1', name: 'Consultas' },
  },
]

describe('Services API', () => {
  const originalFetch = global.fetch

  beforeEach(() => { global.fetch = vi.fn() })
  afterEach(() => { global.fetch = originalFetch; vi.clearAllMocks() })

  describe('GET /api/services', () => {
    it('should return list of services and categories', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ services: mockServices, categories: mockCategories }) } as Response)
      const response = await fetch('/api/services')
      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data.services).toHaveLength(1)
    })

    it('should filter services by categoryId', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ services: mockServices, categories: mockCategories }) } as Response)
      const response = await fetch('/api/services?categoryId=1')
      expect(response.ok).toBe(true)
    })

    it('should filter only active services by default', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ services: mockServices, categories: mockCategories }) } as Response)
      const response = await fetch('/api/services')
      expect(response.ok).toBe(true)
    })

    it('should include inactive services when active=false', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ services: mockServices, categories: mockCategories }) } as Response)
      const response = await fetch('/api/services?active=false')
      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/services', () => {
    it('should create a new service', async () => {
      const newService = { name: 'Consulta de Cardiologia', basePrice: 1200 }
      vi.mocked(fetch).mockResolvedValue({ ok: true, status: 201, json: async () => ({ ...newService, id: '5' }) } as Response)
      const response = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newService) })
      expect(response.status).toBe(201)
    })

    it('should return 400 for validation error - missing name', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Validation error' }) } as Response)
      const response = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basePrice: 100 }) })
      expect(response.status).toBe(400)
    })

    it('should return 400 for validation error - negative price', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Validation error' }) } as Response)
      const response = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', basePrice: -100 }) })
      expect(response.status).toBe(400)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) } as Response)
      const response = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', basePrice: 100 }) })
      expect(response.status).toBe(403)
    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) } as Response)
      const response = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', basePrice: 100 }) })
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/services/[id]', () => {
    it('should return service by id', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => mockServices[0] } as Response)
      const response = await fetch('/api/services/1')
      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data.id).toBe('1')
    })

    it('should return 404 when service not found', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404, json: async () => ({ message: 'Service not found' }) } as Response)
      const response = await fetch('/api/services/999')
      expect(response.status).toBe(404)
    })

    it('should include category information', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => mockServices[0] } as Response)
      const response = await fetch('/api/services/1')
      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data.category).toBeDefined()
    })
  })

  describe('PUT /api/services/[id]', () => {
    it('should update service name', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...mockServices[0], name: 'Updated' }) } as Response)
      const response = await fetch('/api/services/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Updated' }) })
      expect(response.ok).toBe(true)
    })

    it('should update service price', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...mockServices[0], basePrice: 600 }) } as Response)
      const response = await fetch('/api/services/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basePrice: 600 }) })
      const data = await response.json()
      expect(data.basePrice).toBe(600)
    })

    it('should update service category', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...mockServices[0], categoryId: '2', category: { id: '2', name: 'Lab' } }) } as Response)
      const response = await fetch('/api/services/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: '2' }) })
      expect(response.ok).toBe(true)
    })

    it('should toggle service active status', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...mockServices[0], isActive: false }) } as Response)
      const response = await fetch('/api/services/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false }) })
      const data = await response.json()
      expect(data.isActive).toBe(false)
    })

    it('should return 400 for validation error', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'Validation error' }) } as Response)
      const response = await fetch('/api/services/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ basePrice: -50 }) })
      expect(response.status).toBe(400)
    })

    it('should return 404 when service not found for update', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404, json: async () => ({ message: 'Service not found' }) } as Response)
      const response = await fetch('/api/services/999', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test' }) })
      expect(response.status).toBe(404)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) } as Response)
      const response = await fetch('/api/services/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test' }) })
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/services/[id]', () => {
    it('should delete service', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ message: 'Service deleted' }) } as Response)
      const response = await fetch('/api/services/1', { method: 'DELETE' })
      expect(response.ok).toBe(true)
    })

    it('should return 404 when service not found for deletion', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404, json: async () => ({ message: 'Service not found' }) } as Response)
      const response = await fetch('/api/services/999', { method: 'DELETE' })
      expect(response.status).toBe(404)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) } as Response)
      const response = await fetch('/api/services/1', { method: 'DELETE' })
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/services/categories', () => {
    it('should return list of categories', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => mockCategories } as Response)
      const response = await fetch('/api/services/categories')
      expect(response.ok).toBe(true)
    })

    it('should return all categories including inactive', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => mockCategories } as Response)
      const response = await fetch('/api/services/categories?active=false')
      expect(response.ok).toBe(true)
    })
  })

  describe('Category management', () => {
    it('should create a new category', async () => {
      const newCategory = { name: 'Nueva Categoria', description: 'Test', color: '#8b5cf6' }
      vi.mocked(fetch).mockResolvedValue({ ok: true, status: 201, json: async () => ({ ...newCategory, id: '4' }) } as Response)
      const response = await fetch('/api/services/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCategory) })
      expect(response.status).toBe(201)
    })

    it('should update category', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...mockCategories[0], name: 'Updated' }) } as Response)
      const response = await fetch('/api/services/categories/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Updated' }) })
      expect(response.ok).toBe(true)
    })

    it('should toggle category active status', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ...mockCategories[0], isActive: false }) } as Response)
      const response = await fetch('/api/services/categories/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false }) })
      const data = await response.json()
      expect(data.isActive).toBe(false)
    })

    it('should delete category', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ message: 'Category deleted' }) } as Response)
      const response = await fetch('/api/services/categories/1', { method: 'DELETE' })
      expect(response.ok).toBe(true)
    })
  })
})
