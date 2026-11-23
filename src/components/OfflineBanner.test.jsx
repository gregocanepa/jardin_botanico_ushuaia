// The download overlay must never block the page when no service worker is
// being installed (dev server, SW blocked or unsupported).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import OfflineBanner from './OfflineBanner.jsx'

function stubServiceWorker() {
  const sw = {
    getRegistration: vi.fn().mockResolvedValue(undefined),
    getRegistrations: vi.fn().mockResolvedValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  Object.defineProperty(navigator, 'serviceWorker', { value: sw, configurable: true })
}

afterEach(() => {
  delete navigator.serviceWorker
})

describe('OfflineBanner', () => {
  it('shows nothing when no service worker gets registered (e.g. npm run dev)', async () => {
    stubServiceWorker() // supported, but the (mocked) register never happens
    render(<OfflineBanner />)
    await act(() => new Promise((r) => setTimeout(r, 50)))
    expect(screen.queryByText('Descargando contenido para uso sin internet')).not.toBeInTheDocument()
  })

  it('shows nothing when the browser has no service worker support', () => {
    render(<OfflineBanner />)
    expect(screen.queryByText('Descargando contenido para uso sin internet')).not.toBeInTheDocument()
  })
})
