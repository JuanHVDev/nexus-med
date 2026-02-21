# Pruebas de Carga (Load Testing)

Este directorio contiene pruebas de carga para la API del sistema HC Gestor usando **k6**.

## Requisitos

### Instalar k6

```bash
# Opción 1: npm global
npm install -g k6

# Opción 2: brew (macOS)
brew install k6

# Opción 3: Chocolatey (Windows)
choco install k6

# Opción 4: Docker
docker pull grafana/k6
```

## Uso

### Ejecutar todas las pruebas de carga

```bash
# Usando pnpm (definido en package.json)
pnpm test:load

# O directamente con k6
k6 run tests/load/scenarios/full-workflow.test.js
```

### Ejecutar pruebas específicas por escenario

```bash
# Ligero (10 usuarios)
pnpm test:load:light

# Medio (50 usuarios)
pnpm test:load:medium

# Alto (200 usuarios)
pnpm test:load:high

# Estrés (500 usuarios)
pnpm test:load:stress
```

### Ejecutar pruebas por categoría

```bash
# Autenticación
k6 run tests/load/scenarios/auth.test.js

# Pacientes
k6 run tests/load/scenarios/patients.test.js

# Citas
k6 run tests/load/scenarios/appointments.test.js

# Notas médicas
k6 run tests/load/scenarios/medical-notes.test.js

# Facturación
k6 run tests/load/scenarios/billing.test.js

# Laboratorio
k6 run tests/load/scenarios/laboratory.test.js

# Reportes
k6 run tests/load/scenarios/reports.test.js

# Portal pacientes
k6 run tests/load/scenarios/portal.test.js

# Flujo completo
k6 run tests/load/scenarios/full-workflow.test.js
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm test:load` | Ejecuta flujo completo con configuración por defecto |
| `pnpm test:load:light` | Prueba ligera (10-25 usuarios) |
| `pnpm test:load:medium` | Prueba media (25-50 usuarios) |
| `pnpm test:load:high` | Prueba alta (100-200 usuarios) |
| `pnpm test:load:stress` | Prueba de estrés (200-500 usuarios) |

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `BASE_URL` | URL base de la aplicación | `http://localhost:3000` |
| `TEST_EMAIL` | Email para pruebas de auth | `admin@clinica.com` |
| `TEST_PASSWORD` | Password para pruebas de auth | `password123` |
| `USERS` | Número de usuarios (override) | Definido en cada escenario |

### Ejemplo con variables

```bash
BASE_URL=https://tu-app.vercel.app TEST_EMAIL=admin@test.com TEST_PASSWORD=123456 pnpm test:load:medium
```

## Métricas

Los resultados se guardan en:
- `tests/load/results/` - Archivos JSON con métricas detalladas
- stdout - Resumen en consola

### Thresholds configurados

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| `p(95) latency` | < 500-1000ms | 95% de requests deben ser más rápidos |
| `http_req_failed` | < 1-3% | Tasa de errores máxima |
| `http_reqs` | > 50 RPS | Requests por segundo mínimos |

## Recomendaciones

### Para desarrollo local
```bash
# Asegúrate que el servidor esté corriendo
pnpm dev

# En otra terminal, ejecuta pruebas ligeras
pnpm test:load:light
```

### Para producción (cuidado)
```bash
# Nunca ejecutar pruebas de carga en producción sin autorización
# Usar entorno de staging o testing
BASE_URL=https://staging-tu-app.vercel.app pnpm test:load:medium
```

## Estructura de archivos

```
tests/load/
├── config.js              # Configuración común y utilidades
├── README.md              # Este archivo
├── escenarios/
│   ├── auth.test.js        # Pruebas de autenticación
│   ├── patients.test.js   # CRUD pacientes
│   ├── appointments.test.js # Citas
│   ├── medical-notes.test.js # Notas médicas
│   ├── billing.test.js    # Facturación
│   ├── laboratory.test.js # Laboratorio
│   ├── reports.test.js    # Reportes
│   ├── portal.test.js     # Portal pacientes
│   └── full-workflow.test.js # Flujo completo
└── results/               # Resultados de pruebas (generado)
```

## Solución de problemas

### "k6 command not found"
```bash
# Verificar instalación
k6 version

# Si no está, instalar
npm install -g k6
```

### "connection refused"
- Verificar que el servidor esté corriendo
- Cambiar BASE_URL si es necesario

### "too many requests" (429)
- Reducir número de usuarios
- Aumentar tiempo de ramp-up

## Notas

- Las pruebas están diseñadas para ejecutarse contra `localhost:3000` por defecto
- Algunos endpoints pueden requerir autenticación - las pruebas manejan tanto casos con como sin auth
- Los resultados de las pruebas se guardan en `tests/load/results/`
