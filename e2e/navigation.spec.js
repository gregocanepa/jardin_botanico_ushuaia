// Online navigation on the production build.
import { test, expect } from '@playwright/test'
import { byOrder } from './helpers.js'

const first = byOrder[0]
const last = byOrder[byOrder.length - 1]

test('home → station → next → end of tour', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: new RegExp(first.name.es) }).click()
  await expect(page).toHaveURL(`/estacion/${first.slug}`)
  await expect(page.getByRole('heading', { level: 1, name: first.name.es })).toBeVisible()

  for (const station of byOrder.slice(1)) {
    await page.getByRole('button', { name: /Siguiente/ }).click()
    await expect(page).toHaveURL(`/estacion/${station.slug}`)
    await expect(page.getByRole('heading', { level: 1, name: station.name.es })).toBeVisible()
  }

  await page.getByRole('button', { name: /Fin del recorrido/ }).click()
  await expect(page).toHaveURL('/')
})

test('QR deep link opens the station directly (fresh load, no service worker yet)', async ({ page }) => {
  await page.goto(`/estacion/${last.slug}`)
  await expect(page.getByRole('heading', { level: 1, name: last.name.es })).toBeVisible()
})

test('language choice switches content and survives a reload', async ({ page }) => {
  await page.goto(`/estacion/${first.slug}`)
  await page.getByRole('button', { name: 'Change language' }).click()
  await expect(page.getByRole('heading', { level: 1, name: first.name.en })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: first.name.en })).toBeVisible()
  await expect(page.locator('audio')).toHaveAttribute('src', first.audio.en)
})

test('unknown route shows the NotFound page', async ({ page }) => {
  await page.goto('/no-existe')
  await expect(page.getByRole('heading', { level: 1, name: /no encontrada/i })).toBeVisible()
})

test.fixme('SW-007 / SW-042: unknown station slug shows the NotFound page', async ({ page }) => {
  await page.goto('/estacion/no-existe')
  await expect(page.getByRole('heading', { level: 1, name: /no encontrada/i })).toBeVisible()
})

test.fixme('SW-013: "Siguiente" scrolls back to the top of the page', async ({ page }) => {
  await page.goto(`/estacion/${first.slug}`)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
