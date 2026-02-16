# Tests E2E - HC Gestor

## Credenciales de Prueba

Para ejecutar los tests con usuarios reales, asegúrate de que existan:

- **Admin**: admin@clinic.com / password123
- **Doctor**: doctor@clinic.com / password123

## Ejecución de Tests

```bash
# Todos los tests
pnpm test:e2e

# Solo Chromium
pnpm test:e2e --project=chromium

# Tests específicos
pnpm test:e2e -- tests/e2e/auth-basic.spec.ts

# Con UI para debugging
pnpm test:e2e --ui

# En modo headless (CI)
pnpm test:e2e --reporter=dot
```

## Estructura

- `auth-basic.spec.ts` - Tests básicos de UI de login
- `auth-full.spec.ts` - Tests de flujo completo con usuarios
- `app.spec.ts` - Tests de navegación y funcionalidad
- `global-setup.ts` - Setup de base de datos
- `global-teardown.ts` - Cleanup

## Troubleshooting

### Timeout en startup
Aumentar `timeout` en `webServer` en `playwright.config.ts`

### Tests fallan por usuarios no existentes
Ejecutar seed manualmente:
```bash
pnpm test:db:seed
```

### Selectores no encuentran elementos
Verificar que la UI no ha cambiado recientemente.
