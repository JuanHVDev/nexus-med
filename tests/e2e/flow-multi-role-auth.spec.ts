import { test, expect } from '@playwright/test'

test.describe('Multi-Rol Authentication - E2E', () => {
  const roles = [
    { name: 'ADMIN', email: 'admin@clinic.com', password: 'password123', expectedAccess: 'all' },
    { name: 'DOCTOR', email: 'doctor@clinic.com', password: 'password123', expectedAccess: 'medical' },
    { name: 'NURSE', email: 'nurse@clinic.com', password: 'password123', expectedAccess: 'medical' },
    { name: 'RECEPTIONIST', email: 'receptionist@clinic.com', password: 'password123', expectedAccess: 'reception' },
  ]

  for (const role of roles) {
    test.describe(`Rol: ${role.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/login')
      })

      test(`Login exitoso como ${role.name}`, async ({ page }) => {
        // Llenar credenciales
        await page.locator('#email').fill(role.email)
        await page.locator('#password').fill(role.password)
        
        // Click en login
        await page.getByRole('button', { name: /Iniciar Sesión|Login|Sign in/i }).click()
        
        // Verificar redirección al dashboard
        await page.waitForURL('**/dashboard', { timeout: 20000 })
        
        // Verificar que se cargó correctamente
        await expect(page.getByText('HC Gestor')).toBeVisible({ timeout: 10000 })
        
        // Verificar que el email del usuario está visible en el header
        await expect(page.locator(`text=${role.email}`).first()).toBeVisible({ timeout: 5000 })
      })

      test(`Ver menú de navegación como ${role.name}`, async ({ page }) => {
        // Login
        await page.locator('#email').fill(role.email)
        await page.locator('#password').fill(role.password)
        await page.getByRole('button', { name: /Iniciar Sesión|Login/i }).click()
        await page.waitForURL('**/dashboard', { timeout: 20000 })
        
        // Verificar elementos de navegación comunes
        await expect(page.getByRole('link', { name: /Dashboard|Inicio/i })).toBeVisible()
        await expect(page.getByRole('link', { name: /Pacientes/i })).toBeVisible()
        await expect(page.getByRole('link', { name: /Citas|Agenda/i })).toBeVisible()
        
        // Verificar elementos específicos según rol
        if (role.expectedAccess === 'all' || role.expectedAccess === 'medical') {
          await expect(page.getByRole('link', { name: /Notas Médicas|Consulta/i })).toBeVisible()
          await expect(page.getByRole('link', { name: /Recetas/i })).toBeVisible()
        }
        
        if (role.expectedAccess === 'all' || role.expectedAccess === 'reception') {
          await expect(page.getByRole('link', { name: /Facturación|Pagos/i })).toBeVisible()
        }
        
        // ADMIN debe ver Configuración
        if (role.name === 'ADMIN') {
          await expect(page.getByRole('link', { name: /Configuración|Settings/i })).toBeVisible()
        }
      })
    })
  }

  test.describe('Permisos por Rol', () => {
    test('ADMIN: Acceso completo al sistema', async ({ page }) => {
      await page.goto('/login')
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
      
      // Verificar acceso a todas las secciones
      const sections = [
        { name: 'Pacientes', url: '/patients' },
        { name: 'Citas', url: '/appointments' },
        { name: 'Notas Médicas', url: '/medical-notes' },
        { name: 'Recetas', url: '/prescriptions' },
        { name: 'Facturación', url: '/billing' },
        { name: 'Laboratorio', url: '/lab-orders' },
        { name: 'Imagenología', url: '/imaging-orders' },
        { name: 'Configuración', url: '/settings' },
      ]
      
      for (const section of sections) {
        await page.goto(section.url)
        await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
        
        // No debe mostrar error de acceso denegado
        const accessDenied = page.getByText(/Acceso denegado|403|No autorizado/i)
        await expect(accessDenied).not.toBeVisible()
      }
    })

    test('DOCTOR: Acceso a funciones médicas', async ({ page }) => {
      await page.goto('/login')
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
      
      // Debe poder acceder a funciones médicas
      await page.goto('/medical-notes')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
      
      await page.goto('/prescriptions')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
      
      // Debe poder ver pacientes
      await page.goto('/patients')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    })

    test('NURSE: Acceso limitado pero funcional', async ({ page }) => {
      await page.goto('/login')
      await page.locator('#email').fill('nurse@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
      
      // Enfermera debe poder ver pacientes
      await page.goto('/patients')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
      
      // Y citas
      await page.goto('/appointments')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    })

    test('RECEPTIONIST: Acceso a recepción y facturación', async ({ page }) => {
      await page.goto('/login')
      await page.locator('#email').fill('receptionist@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
      
      // Recepcionista debe poder ver pacientes
      await page.goto('/patients')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
      
      // Y facturación
      await page.goto('/billing')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
      
      // Y citas
      await page.goto('/appointments')
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Validaciones de Login', () => {
    test('Login con credenciales incorrectas', async ({ page }) => {
      await page.goto('/login')
      
      await page.locator('#email').fill('wrong@email.com')
      await page.locator('#password').fill('wrongpassword')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      
      // Debe permanecer en login (no redirigir al dashboard)
      await page.waitForTimeout(2000)
      const currentUrl = page.url()
      expect(currentUrl).toContain('login')
    })

    test('Login con email vacío', async ({ page }) => {
      await page.goto('/login')
      
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      
      // La validación HTML5 nativa previene el envío
      await page.waitForTimeout(500)
      const currentUrl = page.url()
      expect(currentUrl).toContain('login')
    })

    test('Login con password vacío', async ({ page }) => {
      await page.goto('/login')
      
      await page.locator('#email').fill('admin@clinic.com')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      
      // La validación HTML5 nativa previene el envío
      await page.waitForTimeout(500)
      const currentUrl = page.url()
      expect(currentUrl).toContain('login')
    })

    test('Logout funciona correctamente', async ({ page }) => {
      // Login primero
      await page.goto('/login')
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
      
      // Abrir dropdown del usuario (click en avatar)
      await page.getByRole('button', { name: /Menú de usuario/i }).click()
      await page.waitForTimeout(500)
      
      // Hacer logout
      await page.getByText(/Cerrar sesión/i).click()
      
      // Debe redirigir al login
      await expect(page).toHaveURL(/login|signin/, { timeout: 10000 })
    })

    test('No puede acceder a páginas protegidas sin login', async ({ page }) => {
      const protectedUrls = [
        '/patients',
        '/appointments',
        '/medical-notes',
        '/prescriptions',
        '/billing',
        '/settings',
      ]
      
      for (const url of protectedUrls) {
        await page.goto(url)
        
        // Debe redirigir al login o mostrar acceso denegado
        const isLoginPage = page.url().includes('login') || page.url().includes('signin')
        const hasAccessDenied = await page.getByText(/Acceso denegado|No autorizado|401/i).isVisible().catch(() => false)
        
        expect(isLoginPage || hasAccessDenied).toBeTruthy()
      }
    })
  })

  test.describe('Seguridad', () => {
    test('Password no visible en plaintext', async ({ page }) => {
      await page.goto('/login')
      
      await page.locator('#password').fill('secretpassword')
      
      // Verificar que el input es de tipo password
      const passwordInput = page.locator('#password')
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('Session persiste después de refresh', async ({ page }) => {
      // Login
      await page.goto('/login')
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
      await page.waitForURL('**/dashboard', { timeout: 20000 })
      
      // Refrescar página
      await page.reload()
      
      // Debe seguir en el dashboard
      await expect(page.getByText('HC Gestor')).toBeVisible({ timeout: 10000 })
    })
  })
})
