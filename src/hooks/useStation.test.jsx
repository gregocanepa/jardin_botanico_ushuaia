// SW-008: a translation missing in stations.json falls back to Spanish instead of crashing.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resolve } from './useStation'
import { renderApp } from '../test/renderApp.jsx'

// A station whose English translation is incomplete (e.g. content added in a hurry)
const partial = vi.hoisted(() => ({
  id: 1,
  slug: 'parcial',
  order: 1,
  name: { es: 'Helechos', en: 'Ferns' },
  scientificName: 'Polypodiopsida',
  shortDescription: { es: 'Plantas sin flores' },
  description: { es: 'Descripción en español.', en: '' },
  facts: { es: { familia: 'Polypodiaceae' } },
  tags: { es: ['sombra'] },
  audio: { es: '/audio/parcial-es.mp4' },
  audioDuration: '1:00',
  images: [],
  links: [],
}))

vi.mock('../data/stations.json', () => ({ default: [partial] }))

beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}))

describe('resolve()', () => {
  it('uses the requested language when it exists', () => {
    expect(resolve(partial, 'en').name).toBe('Ferns')
  })

  it('falls back to Spanish for every missing or empty translation', () => {
    const s = resolve(partial, 'en')
    expect(s.shortDescription).toBe('Plantas sin flores')
    expect(s.description).toBe('Descripción en español.')
    expect(s.facts).toEqual({ familia: 'Polypodiaceae' })
    expect(s.tags).toEqual(['sombra'])
    expect(s.audio).toBe('/audio/parcial-es.mp4')
  })

  it('missing in every language → empty facts/tags (pages can still render)', () => {
    const s = resolve({ ...partial, facts: undefined, tags: { en: [] } }, 'fr')
    expect(s.facts).toEqual({})
    expect(s.tags).toEqual([])
  })

  it('keeps non-translated fields untouched', () => {
    const s = resolve(partial, 'en')
    expect(s.slug).toBe('parcial')
    expect(s.scientificName).toBe('Polypodiopsida')
    expect(s.images).toEqual([])
  })
})

describe('Station page with an incomplete English translation', () => {
  it('switching to English shows the Spanish fallback instead of crashing', async () => {
    const { container } = renderApp('/estacion/parcial')
    await userEvent.click(screen.getAllByRole('button', { name: 'Change language' })[0])

    expect(screen.queryByRole('alert')).not.toBeInTheDocument() // no ErrorBoundary fallback
    expect(screen.getByRole('heading', { level: 1, name: 'Ferns' })).toBeInTheDocument()
    expect(screen.getByText('Descripción en español.')).toBeInTheDocument()
    expect(screen.getByText('Polypodiaceae')).toBeInTheDocument()
    expect(screen.getByText('sombra')).toBeInTheDocument()
    expect(container.querySelector('audio')).toHaveAttribute('src', '/audio/parcial-es.mp4')
  })

  it('the station list in English also renders', async () => {
    renderApp('/')
    await userEvent.click(screen.getAllByRole('button', { name: 'Change language' })[0])
    expect(screen.getByText('Plantas sin flores')).toBeInTheDocument()
  })
})
