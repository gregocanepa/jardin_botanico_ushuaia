// Service worker (vite-plugin-pwa, strategy: injectManifest).
// The build injects the list of files to precache into self.__WB_MANIFEST.
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
} from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { createPartialResponse } from 'workbox-range-requests'
import { clientsClaim } from 'workbox-core'

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

// JS/CSS/HTML, audio and images from public/ (see globPatterns in vite.config.js)
precacheAndRoute(self.__WB_MANIFEST)
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
