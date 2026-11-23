# Jardín Botánico — Self-Guided Tour App

## What this project is
Offline-capable web app for self-guided tours in a botanic garden. Visitors scan QR codes at each station and access plant information, narrated audio, and photos. The app must work **without internet connection** once cached.

**Browser-only (for now):** the app is used in the phone's browser and is **not** an installable app — no "Add to Home Screen", no install prompt. The service worker is kept only for offline caching.

## Stack
- **React 18** + **React Router 6** — page navigation
- **Vite 5** + **vite-plugin-pwa** — build and service worker generation (used for offline caching only, not installability)
- **CSS Modules** — component-scoped styles (no Tailwind, no styled-components)
- **Static JSON** — station content in `src/data/stations.json`
- **No backend** — fully static frontend, deployed on Cloudflare Pages

## Folder structure
```
src/
├── components/       # Reusable components (AudioPlayer, etc.)
├── pages/            # Pages: Home.jsx, Station.jsx, NotFound.jsx
├── hooks/            # Custom hooks: useStation.js
├── data/
│   └── stations.json # Single source of truth for all content
├── index.css         # Global CSS variables and reset
└── App.jsx           # Main routing

public/
├── audio/            # .mp3 narration files (one per station)
├── images/           # Plant photos (naming: {slug}-1.jpg, {slug}-2.jpg)
└── icons/            # Favicon / apple-touch-icon (install icons not needed for now)

memory-bank/          # Persistent context for Claude Code sessions
```

## Important conventions

### Static assets (audio and images)
- Always go in `public/`, NOT in `src/assets/`
- Vite renames files in `src/` with a content hash at build time → hardcoded paths in JSON break in production
- Path in JSON: `/audio/slug.mp3`, `/images/slug-1.jpg`

### Styling
- Warm palette: dark brown `#2C1A0E`, cream `#F5EDE0`, terracotta `#854F0B`, sage green `#4A6741`
- CSS variables defined in `src/index.css` — always use them, never hardcode colors
- Mobile-first, max-width 480px on `#root`
- No external UI libraries

### Station data shape
```json
{
  "id": 1,
  "slug": "url-name",
  "order": 1,
  "name": "Display name",
  "scientificName": "Family ...",
  "shortDescription": "One line for the station list",
  "description": "Full text for the station page",
  "facts": { "key": "value" },
  "tags": ["tag1", "tag2"],
  "audio": "/audio/slug.mp3",
  "audioDuration": "2:34",
  "images": ["/images/slug-1.jpg"],
  "links": [{ "label": "Text", "url": "https://..." }]
}
```

### Routes
- `/` → Home (station list + garden map)
- `/estacion/:slug` → Individual station page
- QR codes link directly to `/estacion/{slug}`

### Offline behavior
- Custom service worker in `src/sw.js` (vite-plugin-pwa `injectManifest`); the precache list is injected at build time from `injectManifest.globPatterns` in `vite.config.js`
- Everything is **precached** on first visit: build files, audio and images. No runtime caches
- Max **5 MB per precached file** (`MAX_PRECACHE_FILE_SIZE_MB` in `vite.config.js`, not an env var). A bigger file makes `npm run build` fail — re-export the audio (mono, lower bitrate) before raising the limit
- Audio is served from the precache by a custom route that honours `Range` requests (206) — required for offline seek and for playback on iOS Safari. Do not remove it or register it after `precacheAndRoute`
- SW is inactive in dev mode — always test offline with `npm run build && npm run preview`
- Caches are per browser: content cached in Chrome isn't available in another browser or a QR-scanner's in-app browser. Visitors must use the same browser for the entrance QR and station QRs
- Test offline in a normal browser tab (not an installed app): load once, go offline, close/reopen the tab, deep-link to `/estacion/{slug}`

## Testing
- `npm test` — unit tests (Vitest + Testing Library, jsdom). Config: `vitest.config.js` (no PWA plugin; `virtual:pwa-register/react` is mocked in `src/test/`)
- `npm run test:e2e` — E2E (Playwright) against the **production build** (`npm run build && vite preview` on :4173). Offline tests live in `e2e/offline.spec.js`
- E2E uses **Google Chrome** (`channel: 'chrome'`), not Playwright's Chromium — Chromium has no AAC codec, so the `.mp4` narration can't play there
- `src/data/stations.test.js` validates content: unique ids/slugs/order, URL-safe slugs, both languages, and that every audio/image path exists in `public/`
- Known bugs not fixed yet are `it.todo` / `test.fixme` named with their task ID (e.g. `SW-007`). When fixing one, turn its test on
- Every fix or feature should come with a test that fails without it

## What NOT to do
- Do not move audio/images to `src/assets/` — paths break in production
- Do not install UI libraries (MUI, Chakra, etc.) — use CSS Modules
- Do not add a backend — static-only by architectural decision
- Do not switch to HashRouter — Cloudflare Pages supports BrowserRouter with redirects
- Do not add install features (install prompt, `beforeinstallprompt`, splash screens, maskable icons, manifest polish) — the app is browser-only for now

## Deploy
- Platform: **Cloudflare Pages**
- Build command: `npm run build`
- Output directory: `dist`
- To test offline locally: `npm run build && npm run preview`
