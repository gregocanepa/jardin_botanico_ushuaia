// Offline behaviour — the core promise of the app. Simulates a visitor who
// opens the app at the entrance Wi-Fi and then walks into the garden with no signal.
import { test, expect } from '@playwright/test'
import { allAudio, byOrder, publicImages, loadAndWaitForOffline, precachedPaths } from './helpers.js'

test.describe('after the first visit, offline', () => {
  test.beforeEach(async ({ page, context }) => {
    await loadAndWaitForOffline(page)
    await context.setOffline(true)
  })

  // SW-001 / SW-023: everything is downloaded at the entrance.
  test('every audio file and image is in the precache', async ({ page }) => {
    const cached = await precachedPaths(page)
    for (const path of [...allAudio, ...publicImages]) {
      expect(cached, `${path} not precached`).toContain(path)
    }
  })

  test('every station opens from a QR deep link', async ({ page }) => {
    for (const station of byOrder) {
      await page.goto(`/estacion/${station.slug}`)
      await expect(page.getByRole('heading', { level: 1, name: station.name.es })).toBeVisible()
    }
  })

  test('images are served from the cache', async ({ page }) => {
    for (const path of publicImages) {
      const res = await page.evaluate(async (p) => {
        const r = await fetch(p)
        return { status: r.status, type: r.headers.get('content-type') }
      }, path)
      expect(res.status, path).toBe(200)
      expect(res.type, path).toMatch(/^image\//)
    }
  })

  // SW-002: the precache must answer Range requests with 206, or seeking
  // breaks offline and iOS Safari refuses to play.
  for (const path of allAudio) {
    test(`audio ${path} answers Range requests with 206`, async ({ page }) => {
      const res = await page.evaluate(async (p) => {
        const r = await fetch(p, { headers: { Range: 'bytes=0-1' } })
        return { status: r.status, range: r.headers.get('content-range'), bytes: (await r.arrayBuffer()).byteLength }
      }, path)
      expect(res.status).toBe(206)
      expect(res.range).toMatch(/^bytes 0-1\/\d+$/)
      expect(res.bytes).toBe(2)
    })

    test(`audio ${path} plays and seeks`, async ({ page }) => {
      const result = await page.evaluate(async (p) => {
        const audio = new Audio(p)
        audio.muted = true
        const once = (ev) => new Promise((resolve, reject) => {
          audio.addEventListener(ev, resolve, { once: true })
          audio.addEventListener('error', () => reject(new Error(`media error ${audio.error?.code}`)), { once: true })
        })
        await once('loadedmetadata')
        const target = audio.duration * 0.8
        audio.currentTime = target
        await once('seeked')
        await audio.play()
        return { target, currentTime: audio.currentTime, paused: audio.paused }
      }, path)
      expect(result.currentTime).toBeGreaterThanOrEqual(result.target - 0.5)
      expect(result.paused).toBe(false)
    })
  }

  test('play button on the station page plays the narration', async ({ page }) => {
    const station = byOrder[0]
    await page.goto(`/estacion/${station.slug}`)
    await page.getByRole('button', { name: 'Reproducir audio' }).click()
    await expect.poll(() => page.locator('audio').evaluate((a) => a.currentTime), { timeout: 5000 })
      .toBeGreaterThan(0.2)
  })
})
