// SW-005 / SW-037: a runtime error must show a way out, never a blank screen.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.jsx'
import { renderApp } from '../test/renderApp.jsx'

const crash = vi.hoisted(() => ({ station: false, banner: false }))

vi.mock('../pages/Station.jsx', async (importOriginal) => {
  const { default: Station } = await importOriginal()
  return {
    default: (props) => {
      if (crash.station) throw new Error('station broke')
      return <Station {...props} />
    },
  }
})

vi.mock('./OfflineBanner.jsx', () => ({
  default: () => {
    if (crash.banner) throw new Error('banner broke')
    return null
  },
}))

function Boom() {
  throw new Error('boom')
}

beforeEach(() => {
  crash.station = false
  crash.banner = false
  vi.spyOn(console, 'error').mockImplementation(() => {}) // React logs caught errors
})
afterEach(() => vi.restoreAllMocks())

const fallback = () => screen.queryByRole('alert')

describe('ErrorBoundary', () => {
  it('shows a bilingual fallback with a way back to the tour and a reload button', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(fallback()).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver al recorrido/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: /Recargar/ })).toBeInTheDocument()
  })

  it('renders its children when nothing fails', () => {
    render(<ErrorBoundary><p>ok</p></ErrorBoundary>)
    expect(screen.getByText('ok')).toBeInTheDocument()
    expect(fallback()).not.toBeInTheDocument()
  })

  it('clears the error when resetKey changes (navigating to another page)', () => {
    let fail = true
    function Maybe() {
      if (fail) throw new Error('boom')
      return <p>recovered</p>
    }
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Maybe /></ErrorBoundary>)
    expect(fallback()).toBeInTheDocument()
    fail = false
    rerender(<ErrorBoundary resetKey="/b"><Maybe /></ErrorBoundary>)
    expect(screen.getByText('recovered')).toBeInTheDocument()
  })

  it('logs the error so it is not lost', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(console.error).toHaveBeenCalledWith('[ErrorBoundary]', expect.any(Error), expect.anything())
  })
})

describe('App error handling', () => {
  it('a crashing station page shows the fallback instead of a blank screen', () => {
    crash.station = true
    renderApp('/estacion/orquideas')
    expect(fallback()).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver al recorrido/ })).toBeInTheDocument()
  })

  it('a crashing download overlay does not take the tour down', () => {
    crash.banner = true
    renderApp('/')
    expect(fallback()).not.toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0) // station list
  })
})
