// SW-005: a runtime error in the production build shows a way out, not a blank screen.
// Real trigger: an unknown language saved in localStorage ('fr') makes the
// pages read strings that don't exist and throw while rendering.
import { test, expect } from '@playwright/test'

async function breakLanguage(page) {
  await page.goto('/')
  // Let the first-visit download finish, so its overlay doesn't cover the page
  const banner = page.getByText('Descargando contenido para uso sin internet')
  await expect(banner).toBeVisible()
  await expect(banner).toBeHidden({ timeout: 20_000 })
  await page.evaluate(() => localStorage.setItem('lang', 'fr'))
}

test('a crash on a station page shows the bilingual fallback', async ({ page }) => {
  await breakLanguage(page)
  await page.goto('/estacion/orquideas')
  await expect(page.getByRole('heading', { name: 'Algo salió mal' })).toBeVisible()
  await expect(page.getByText('Something went wrong')).toBeVisible()
  await expect(page.getByRole('button', { name: /Recargar/ })).toBeVisible()
})

test('"Volver al recorrido" takes the visitor back to the tour once the cause is gone', async ({ page }) => {
  await breakLanguage(page)
  await page.goto('/estacion/orquideas')
  await expect(page.getByRole('heading', { name: 'Algo salió mal' })).toBeVisible()
  await page.evaluate(() => localStorage.removeItem('lang'))
  await page.getByRole('link', { name: /Volver al recorrido/ }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Algo salió mal' })).toBeHidden()
  await expect(page.getByRole('button', { name: /Orquídeas/ })).toBeVisible()
})
