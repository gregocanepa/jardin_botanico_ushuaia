// @vitest-environment node
// SW-006: every icon / asset linked from index.html must exist in public/.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const html = readFileSync(new URL('index.html', root), 'utf8')
const links = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => ({
  rel: tag.match(/rel="([^"]+)"/)?.[1],
  href: tag.match(/href="([^"]+)"/)?.[1],
}))

describe('index.html', () => {
  it('has a favicon and an apple-touch-icon', () => {
    expect(links.some((l) => l.rel === 'icon')).toBe(true)
    expect(links.some((l) => l.rel === 'apple-touch-icon')).toBe(true)
  })

  it.each(links.filter((l) => l.href?.startsWith('/')))('$href exists in public/', ({ href }) => {
    expect(existsSync(new URL(`public${href}`, root)), `missing public${href}`).toBe(true)
  })

  it('is browser-only: no manifest and no iOS standalone mode', () => {
    expect(links.some((l) => l.rel === 'manifest')).toBe(false)
    expect(html).not.toMatch(/<meta[^>]*apple-mobile-web-app-capable/)
  })
})
