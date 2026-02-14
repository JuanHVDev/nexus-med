# Configuración de GitHub Actions

## Secrets Necesarios

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions → New repository secret

### 1. VERCEL_TOKEN

1. Ve a [vercel.com/tokens](https://vercel.com/tokens)
2. Crea un nuevo token (nombre: "GitHub Actions")
3. Copia el valor y guárdalo como `VERCEL_TOKEN`

### 2. VERCEL_ORG_ID y VERCEL_PROJECT_ID

Opción A - Usando Vercel CLI:
```bash
# Instalar Vercel CLI
pnpm i -g vercel

# Link proyecto
vercel link

# Ver los IDs en .vercel/project.json
cat .vercel/project.json
```

Opción B - Manual desde el dashboard:
- **VERCEL_ORG_ID**: En Vercel Dashboard → Settings → General
- **VERCEL_PROJECT_ID**: En tu proyecto → Settings → General

### 3. Variables de entorno de la aplicación

Estas deben coincidir con las de tu archivo `.env.local`:

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `BETTER_AUTH_SECRET` - Clave secreta para Better-Auth
- `BETTER_AUTH_URL` - URL de la app (http://localhost:3000 para dev)

## Workflows Creados

1. **CI** (`ci.yml`)
   - Se ejecuta en cada push y PR
   - Lint + Type check + Build

2. **Deploy Preview** (`preview.yml`)
   - Se ejecuta en Pull Requests
   - Deploy temporal para revisión
   - Comenta automáticamente la URL en el PR

3. **Deploy Production** (`production.yml`)
   - Se ejecuta cuando se mergea a `main`
   - Deploy a producción

## Configuración en Vercel

### 1. Conectar repositorio

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio de GitHub
3. Configura:
   - Framework Preset: Next.js
   - Build Command: `pnpm prisma generate && pnpm build`
   - Output Directory: `.next`

### 2. Variables de entorno en Vercel

En tu proyecto Vercel → Settings → Environment Variables:

| Variable | Valor | Entornos |
|----------|-------|----------|
| DATABASE_URL | ... | Production, Preview |
| BETTER_AUTH_SECRET | ... | Production, Preview |
| BETTER_AUTH_URL | https://tudominio.com | Production |
| BETTER_AUTH_URL | https://preview-url.vercel.app | Preview |

### 3. Configurar dominio (opcional)

Settings → Domains → Add your domain

## Prueba del flujo

1. Crea un PR con cualquier cambio
2. Deberías ver:
   - Checks de CI ejecutándose
   - Deploy de preview al finalizar
   - Comentario en el PR con la URL

3. Al mergear a `main`:
   - Se ejecuta deploy a producción automáticamente

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

El workflow ya incluye `pnpm prisma generate`, pero si falla:
```bash
# Asegúrate de que el schema esté commiteado
git add prisma/schema.prisma
git commit -m "add: prisma schema"
```

### Error: "Build failed"

1. Verifica que las variables de entorno estén configuradas en GitHub Secrets
2. Asegúrate de que el build funciona localmente:
   ```bash
   pnpm install
   pnpm prisma generate
   pnpm build
   ```

### Error de permisos en Vercel

Asegúrate de que el token tenga permisos para:
- Projects (read/write)
- Deployments (read/write)

## Comandos útiles

```bash
# Ver estado de los workflows
gh workflow list

# Ver logs de un workflow
gh run list
gh run view <run-id>

# Ejecutar workflow manualmente
gh workflow run ci.yml
```
