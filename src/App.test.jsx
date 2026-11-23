// Routing, station rendering and language switching (jsdom, no service worker).
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from './test/renderApp.jsx'
import stations from './data/stations.json'

const byOrder = [...stations].sort((a, b) => a.order - b.order)
const first = byOrder[0]
const last = byOrder[byOrder.length - 1]

describe('Home', () => {
  it('lists every station in "order"', () => {
    renderApp('/')
    const names = byOrder.map((s) => s.name.es)
    const shown = screen.getAllByRole('button').map((b) => b.textContent)
    const positions = names.map((n) => shown.findIndex((t) => t.includes(n)))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('opens a station when it is tapped', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('button', { name: new RegExp(first.name.es) }))
    expect(screen.getByRole('heading', { level: 1, name: first.name.es })).toBeInTheDocument()
  })
})

describe('Station page', () => {
  it('renders name, description, facts and tags in Spanish by default', () => {
    renderApp(`/estacion/${first.slug}`)
    expect(screen.getByRole('heading', { level: 1, name: first.name.es })).toBeInTheDocument()
    expect(screen.getByText(first.description.es)).toBeInTheDocument()
    for (const value of Object.values(first.facts.es)) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0)
    }
    for (const tag of first.tags.es) expect(screen.getByText(tag)).toBeInTheDocument()
  })

  it('uses the Spanish audio file by default', () => {
    const { container } = renderApp(`/estacion/${first.slug}`)
    expect(container.querySelector('audio')).toHaveAttribute('src', first.audio.es)
  })

  it('"Siguiente" goes to the next station', async () => {
    renderApp(`/estacion/${first.slug}`)
    if (byOrder.length > 1) {
      await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
      expect(screen.getByRole('heading', { level: 1, name: byOrder[1].name.es })).toBeInTheDocument()
    }
  })

  it('the last station shows "Fin del recorrido"', () => {
    renderApp(`/estacion/${last.slug}`)
    expect(screen.getByRole('button', { name: /Fin del recorrido/ })).toBeInTheDocument()
  })

})

describe('Language', () => {
  it('switches the station to English, including the audio file, and remembers it', async () => {
    const { container, unmount } = renderApp(`/estacion/${first.slug}`)
    await userEvent.click(screen.getAllByRole('button', { name: 'Change language' })[0])

    expect(screen.getByRole('heading', { level: 1, name: first.name.en })).toBeInTheDocument()
    expect(screen.getByText(first.description.en)).toBeInTheDocument()
    expect(container.querySelector('audio')).toHaveAttribute('src', first.audio.en)
    expect(localStorage.getItem('lang')).toBe('en')

    unmount()
    renderApp(`/estacion/${first.slug}`)
    expect(screen.getByRole('heading', { level: 1, name: first.name.en })).toBeInTheDocument()
  })

  it.todo('SW-016: updates <html lang> when switching language')
})

describe('Not found', () => {
  function expectNotFound() {
    expect(screen.getByRole('heading', { level: 1, name: 'Estación no encontrada' })).toBeInTheDocument()
    expect(screen.getByText('Station not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver todas las estaciones/ })).toHaveAttribute('href', '/')
  }

  it('unknown routes show the bilingual NotFound page with a way back', () => {
    renderApp('/no-existe')
    expectNotFound()
  })

  // SW-007: an old or mistyped QR used to show 'Station "x" not found' (debug text)
  it('an unknown station slug shows the NotFound page, not the debug text', () => {
    renderApp('/estacion/no-existe')
    expectNotFound()
    expect(screen.queryByText(/Station "no-existe" not found/)).not.toBeInTheDocument()
  })

  it('"Ver todas las estaciones" goes to the station list', async () => {
    renderApp('/estacion/no-existe')
    await userEvent.click(screen.getByRole('link', { name: /Ver todas las estaciones/ }))
    expect(screen.getByRole('button', { name: new RegExp(first.name.es) })).toBeInTheDocument()
  })
})
