import { readdirSync } from 'node:fs'
import stations from '../src/data/stations.json' with { type: 'json' }

export { stations }
export const byOrder = [...stations].sort((a, b) => a.order - b.order)
export const allAudio = stations.flatMap((s) => Object.values(s.audio))
export const publicImages = readdirSync(new URL('../public/images/', import.meta.url))
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .map((f) => `/images/${f}`)

/**
 * Loads the app and waits until the service worker is active, controls the
 * page and has finished precaching (what a visitor does at the entrance Wi-Fi).
 */
export async function loadAndWaitForOffline(page) {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }))
    }
  })
}

/** Paths stored in the precache (Cache Storage). */
export async function precachedPaths(page) {
  return page.evaluate(async () => {
    const paths = []
    for (const name of await caches.keys()) {
      if (!name.includes('precache')) continue
      const cache = await caches.open(name)
      for (const req of await cache.keys()) paths.push(new URL(req.url).pathname)
    }
    return paths
  })
}
