// Talks to the service worker (src/sw.js) about the offline download.
import { messageSW } from 'workbox-window'

const STATUS_TIMEOUT_MS = 3000

/**
 * Asks the active service worker whether every precached file is really in
 * Cache Storage. Resolves { total, cached, complete }, or null if there is no
 * active service worker or it doesn't answer (e.g. an older SW version).
 */
export async function getPrecacheStatus() {
  const registration = await navigator.serviceWorker.getRegistration()
  const sw = registration?.active
  if (!sw) return null
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), STATUS_TIMEOUT_MS))
  const status = await Promise.race([messageSW(sw, { type: 'GET_PRECACHE_STATUS' }), timeout])
  if (!status) return null
  return { ...status, complete: status.total > 0 && status.cached === status.total }
}

/** Calls onProgress({ done, total }) for every file the SW stores during install. */
export function onPrecacheProgress(onProgress) {
  const handler = (event) => {
    if (event.data?.type === 'PRECACHE_PROGRESS') onProgress(event.data)
  }
  navigator.serviceWorker.addEventListener('message', handler)
  return () => navigator.serviceWorker.removeEventListener('message', handler)
}

/** Calls onFail() if the installing service worker dies (a file failed to download). */
export function watchInstallFailure(registration, onFail) {
  const watch = (sw) => {
    sw?.addEventListener('statechange', () => {
      if (sw.state === 'redundant') onFail()
    })
  }
  watch(registration.installing)
  registration.addEventListener('updatefound', () => watch(registration.installing))
}

/** Starts the download from scratch: drop the service worker and reload. */
export async function retryDownload() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((r) => r.unregister()))
  location.reload()
}
