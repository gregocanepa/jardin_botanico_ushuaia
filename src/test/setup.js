import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Some test files run in the node environment (no DOM, no localStorage).
afterEach(() => {
  if (typeof document !== 'undefined') cleanup()
  globalThis.localStorage?.clear()
})
