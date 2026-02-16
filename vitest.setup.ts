import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import '@testing-library/dom'

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
} as unknown as Storage

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
} as unknown as Storage

global.navigator = {
  ...global.navigator,
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
} as unknown as Navigator

beforeAll(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.resetAllMocks()
})
