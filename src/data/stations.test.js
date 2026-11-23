// @vitest-environment node
// Content integrity for stations.json (the single source of truth).
// These run on every `npm test` so broken content is caught before deploy.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import stations from './stations.json'

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url))
const LANGS = ['es', 'en']
const TRANSLATED_FIELDS = ['name', 'shortDescription', 'description', 'facts', 'tags', 'audio']

const publicFileExists = (path) => existsSync(PUBLIC_DIR + path)

describe('stations.json', () => {
  it('has at least one station', () => {
    expect(stations.length).toBeGreaterThan(0)
  })

  it.each(['id', 'slug', 'order'])('has unique %s values', (field) => {
    const values = stations.map((s) => s[field])
    expect(new Set(values).size).toBe(values.length)
  })

  it('uses URL-safe slugs (they are printed on QR codes)', () => {
    for (const s of stations) {
      expect(s.slug, `slug "${s.slug}"`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  describe.each(stations.map((s) => [s.slug, s]))('station "%s"', (_slug, station) => {
    it.each(TRANSLATED_FIELDS)('has "%s" in every language', (field) => {
      for (const lang of LANGS) {
        expect(station[field]?.[lang], `${field}.${lang}`).toBeTruthy()
      }
    })

    it('has the same fact keys in every language', () => {
      const keys = LANGS.map((lang) => Object.keys(station.facts[lang]).sort())
      expect(keys[1]).toEqual(keys[0])
    })

    // SW-001: audio/images live in public/ and are referenced as /audio/... and /images/...
    it('audio paths are under /audio/ and the files exist in public/', () => {
      for (const lang of LANGS) {
        const path = station.audio[lang]
        expect(path).toMatch(/^\/audio\/[^/]+\.mp4$/)
        expect(publicFileExists(path), `missing public${path}`).toBe(true)
      }
    })

    it('image paths are under /images/ and the files exist in public/', () => {
      for (const path of station.images ?? []) {
        expect(path).toMatch(/^\/images\/[^/]+\.(jpe?g|png|webp)$/)
        expect(publicFileExists(path), `missing public${path}`).toBe(true)
      }
    })
  })
})
