// Service worker (vite-plugin-pwa, strategy: injectManifest).
// The build injects the list of files to precache into self.__WB_MANIFEST.
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
  addPlugins,
  getCacheKeyForURL,
} from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { createPartialResponse } from 'workbox-range-requests'
import { clientsClaim, cacheNames } from 'workbox-core'

const PRECACHE_MANIFEST = self.__WB_MANIFEST

// registerType: 'autoUpdate' → the new SW takes control without waiting.
self.skipWaiting()
clientsClaim()

// Audio: served from the precache, honouring Range requests.
// <audio> asks for byte ranges (Range: bytes=...) to seek, and iOS Safari
// requires a 206 response just to play. The default precache route always
// answers 200 with the whole file, which breaks seeking offline. This route
// is registered BEFORE precacheAndRoute so it takes priority.
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/audio/'),
  async ({ request, url }) => {
    const cached = await matchPrecache(url.pathname)
    if (!cached) return fetch(request) // not precached (yet): go to the network
    if (!request.headers.has('range')) return cached
    return createPartialResponse(request, cached)
  }
)

// Download progress for the OfflineBanner: every file stored in the precache
// during install is reported to the open pages as { done, total }.
let precachedCount = 0
addPlugins([
  {
    cacheDidUpdate: async () => {
      precachedCount++
      const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const page of pages) {
        page.postMessage({ type: 'PRECACHE_PROGRESS', done: precachedCount, total: PRECACHE_MANIFEST.length })
      }
    },
  },
])

// JS/CSS/HTML, audio and images from public/ (see globPatterns in vite.config.js)
precacheAndRoute(PRECACHE_MANIFEST)

// The page asks "is everything really in Cache Storage?" before telling the
// visitor the tour works offline. Answers { total, cached }.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'GET_PRECACHE_STATUS') return
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheNames.precache)
      const stored = new Set((await cache.keys()).map((request) => request.url))
      const cached = PRECACHE_MANIFEST.filter((entry) =>
        stored.has(getCacheKeyForURL(typeof entry === 'string' ? entry : entry.url))
      ).length
      event.ports[0]?.postMessage({ total: PRECACHE_MANIFEST.length, cached })
    })()
  )
})
cleanupOutdatedCaches()

// SPA: any navigation (/estacion/:slug, etc.) is answered with index.html,
// so QR deep links work offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Delete caches from the previous generateSW setup (runtime audio/image caches),
// which would otherwise keep a duplicate copy of every file on the phone.
const LEGACY_CACHES = ['audio-cache', 'images-cache']
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all(LEGACY_CACHES.map((name) => caches.delete(name))))
})
