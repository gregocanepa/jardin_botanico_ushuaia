// Routing, station rendering and language switching (jsdom, no service worker).
import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
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

  it.todo('SW-007 / SW-042: unknown slug shows the bilingual NotFound page, not the debug text')
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
  it.todo('SW-008: falls back to Spanish when a field is missing in English instead of crashing')
})

describe('Not found', () => {
  it('unknown routes show the NotFound page with a way back', () => {
    renderApp('/no-existe')
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/no encontrada/i)
    expect(within(document.body).getByRole('button', { name: /Volver al recorrido/ })).toBeInTheDocument()
  })
})
