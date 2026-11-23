// SW-006: icons load in the production build, offline too, and there is no manifest.
import { test, expect } from '@playwright/test'
import { loadAndWaitForOffline, precachedPaths } from './helpers.js'

const iconLinks = (page) =>
  page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')))

test('every icon linked from the page loads as an image', async ({ page, request }) => {
  await page.goto('/')
  const hrefs = await iconLinks(page)
  expect(hrefs.length).toBeGreaterThanOrEqual(3)
  for (const href of hrefs) {
    const res = await request.get(href)
    expect(res.status(), href).toBe(200)
    expect(res.headers()['content-type'], href).toMatch(/^image\//)
  }
})

test('no web app manifest (browser-only, not installable)', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
  expect((await request.get('/manifest.webmanifest')).headers()['content-type'] ?? '').not.toMatch(/manifest/)
})

test('icons are precached, so they also show offline', async ({ page }) => {
  await loadAndWaitForOffline(page)
  const cached = await precachedPaths(page)
  for (const href of await iconLinks(page)) expect(cached).toContain(href)
})
