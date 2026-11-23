// SW-004: the download overlay must reflect the REAL precache state.
// Simulates the entrance Wi-Fi: audio downloads slowly.
import { test, expect } from '@playwright/test'
import { allAudio, precachedPaths } from './helpers.js'

const AUDIO_DELAY_MS = 2500 // per file; Workbox downloads the precache one file at a time
const banner = (page) => page.getByText('Descargando contenido para uso sin internet')

/** The overlay shows up (a SW starts installing) and closes once everything is cached. */
async function waitForDownload(page) {
  await expect(banner(page)).toBeVisible()
  await expect(banner(page)).toBeHidden({ timeout: 20_000 })
}

async function slowAudio(context, delay = AUDIO_DELAY_MS) {
  await context.route('**/audio/*', async (route) => {
    await new Promise((r) => setTimeout(r, delay))
    await route.continue()
  })
}

test('stays visible while files are still downloading (no fake "ready")', async ({ page, context }) => {
  await slowAudio(context)
  await page.goto('/')
  await expect(banner(page)).toBeVisible()

  // Old bug: the overlay closed after 2.7 s even though audio was still downloading.
  await page.waitForTimeout(4500) // past the old 2.7 s timeout + 1.3 s fade-out
  await expect(banner(page)).toBeVisible()
  const cachedSoFar = await precachedPaths(page)
  expect(allAudio.some((a) => !cachedSoFar.includes(a))).toBe(true)

  // It closes only once everything is really cached.
  await expect(banner(page)).toBeHidden({ timeout: 20_000 })
  const cached = await precachedPaths(page)
  for (const a of allAudio) expect(cached).toContain(a)
})

test('progress bar reflects the real number of downloaded files', async ({ page, context }) => {
  await slowAudio(context)
  await page.goto('/')
  const bar = page.getByRole('progressbar')
  await expect(bar).toBeVisible()

  // Some files (JS/CSS) arrive fast, audio is slow → partial progress, not 0 and not 100.
  await expect.poll(async () => Number(await bar.getAttribute('aria-valuenow')), { timeout: 4000 })
    .toBeGreaterThan(0)
  expect(Number(await bar.getAttribute('aria-valuenow'))).toBeLessThan(100)
  await expect(banner(page)).toBeHidden({ timeout: 20_000 })
})

test('a failed download shows an error with "Reintentar", never "ready"', async ({ page, context }) => {
  await context.route('**/audio/*', (route) => route.abort('internetdisconnected'))
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Reintentar/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/No se pudo descargar/)).toBeVisible()

  // Retry with the connection back → downloads everything and closes.
  await context.unroute('**/audio/*')
  await page.getByRole('button', { name: /Reintentar/ }).click()
  await waitForDownload(page)
  const cached = await precachedPaths(page)
  for (const a of allAudio) expect(cached).toContain(a)
})

test('the visitor can continue without waiting, and the overlay comes back next time', async ({ page, context }) => {
  await slowAudio(context, 60_000)
  await page.goto('/')
  await page.getByRole('button', { name: /Continuar sin esperar/ }).click()
  await expect(banner(page)).toBeHidden()
  await page.reload()
  await expect(banner(page)).toBeVisible()
})

test('second visit with everything cached: no overlay (QR deep link goes straight to the station)', async ({ page }) => {
  await page.goto('/')
  await waitForDownload(page)
  await page.goto('/estacion/orquideas')
  await expect(page.getByRole('heading', { level: 1, name: 'Orquídeas' })).toBeVisible()
  await expect(banner(page)).toBeHidden()
})
