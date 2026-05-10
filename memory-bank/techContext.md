# Tech Context

## Full stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 + React Router 6 | Reusable components, slug-based routing |
| Build | Vite 5 | Fast, official PWA plugin |
| PWA / Offline | vite-plugin-pwa + Workbox | Auto-generates SW, caching strategies |
| Styles | CSS Modules | No extra dependencies, locally scoped |
| Data | Static JSON | No backend, works offline, easy to edit |
| Deploy | Cloudflare Pages | Free, CDN, HTTPS, custom domain |

## Key technical decisions

### Why static JSON and not a CMS?
For the PoC and initial phase, JSON is sufficient. The `useStation.js` hook is the single data access point — migrating to a headless CMS (Contentful, Sanity) in the future only requires changing that file.

### Why assets in `public/` and not `src/assets/`?
Vite hashes filenames in `src/assets/` at build time (`orquideas-Bx3kP9mQ.mp3`). Since paths are hardcoded in the JSON, they break in production. Files in `public/` are copied as-is and accessible from the root.

### Why `rangeRequests: true` in audio cache?
The browser's `<audio>` element makes HTTP range requests for seeking (it requests file fragments, not the whole file). Without this option, seeking fails when the user is offline. This is a Workbox option that enables range request support in the service worker.

### Why no backend?
- Reduces costs to zero (Cloudflare Pages is free)
- Eliminates operational complexity
- Garden content rarely changes (plants don't move)
- JSON can be manually edited or scripted when updates are needed

## Relevant file structure
```
src/
├── components/AudioPlayer.jsx + .module.css
├── pages/Home.jsx + Station.jsx + NotFound.jsx (each with .module.css)
├── hooks/useStation.js          ← single data access point
├── data/stations.json           ← single source of truth
├── App.jsx                      ← routing: / and /estacion/:slug
├── main.jsx                     ← entry point with BrowserRouter
└── index.css                    ← global CSS variables

public/
├── audio/{slug}.mp3
├── images/{slug}-{n}.jpg
└── icons/icon-192.png, icon-512.png

vite.config.js                   ← PWA config with globPatterns and runtimeCaching
CLAUDE.md                        ← project conventions for Claude Code
```

## Global CSS variables (src/index.css)
```css
--color-bg:         #F5EDE0
--color-surface:    #FFFFFF
--color-primary:    #854F0B
--color-primary-dk: #633806
--color-accent:     #C8A96E
--color-sage:       #4A6741
--color-sage-lt:    #7A9E6E
--color-text:       #2C1A0E
--color-text-muted: #8A7060
--color-border:     #E8DECE
```

## Useful commands
```bash
npm run dev              # dev server (SW inactive in dev)
npm run build            # production build
npm run preview          # build preview (SW active — test offline here)
```
