import { spawn } from 'child_process'
import { fetch, agents } from 'undici'
import { beforeAll, afterAll, vi } from 'vitest'

let serverProcess: ReturnType<typeof spawn> | null = null
let baseUrl = 'http://localhost:3456'

export async function startTestServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Starting test server...')
    
    serverProcess = spawn('pnpm', ['dev', '-p', '3456'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3456',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/hc_gestor_test?schema=public',
      },
    })

    let started = false
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Server startup timeout'))
      }
    }, 60000)

    serverProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      console.log('[Server]:', output.trim())
      
      if (output.includes('Ready on') || output.includes('started server')) {
        started = true
        clearTimeout(timeout)
        resolve(baseUrl)
      }
    })

    serverProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      if (!output.includes('Deprecation') && !output.includes('Warning')) {
        console.error('[Server Error]:', output.trim())
      }
    })

    serverProcess.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

export async function stopTestServer(): Promise<void> {
  if (serverProcess) {
    console.log('Stopping test server...')
    serverProcess.kill('SIGTERM')
    serverProcess = null
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

export function getBaseUrl(): string {
  return baseUrl
}

export { fetch, agents }

beforeAll(async () => {
  try {
    baseUrl = await startTestServer()
    console.log(`Test server running at ${baseUrl}`)
  } catch (error) {
    console.error('Failed to start test server:', error)
  }
})

afterAll(async () => {
  await stopTestServer()
})

export default { fetch, agents }
