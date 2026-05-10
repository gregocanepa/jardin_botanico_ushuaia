# Project Progress

## Done ✓

### Design and prototype
- [x] Visual station prototype (interactive widget with audio player)
- [x] Funding pitch deck (8 slides, .pptx)
- [x] Color palette and visual style defined (warm/natural)

### Architecture
- [x] Stack decision: React + Vite + PWA, no backend
- [x] Hosting decision: Cloudflare Pages (free)
- [x] Data decision: static JSON (CMS-migratable via useStation hook)
- [x] Folder structure defined and created

### Codebase
- [x] `vite.config.js` with PWA configured (SW, manifest, cache strategies)
- [x] `App.jsx` with routing: `/` and `/estacion/:slug`
- [x] `src/index.css` with global CSS variables and reset
- [x] `useStation.js` hook (data access abstraction)
- [x] `AudioPlayer.jsx` with play/pause, progress bar, seek
- [x] `Home.jsx` — station list (map placeholder pending)
- [x] `Station.jsx` — full individual station page
- [x] `NotFound.jsx` — error page for outdated QR codes
- [x] `stations.json` with 2 sample stations (Orquídeas, Cactáceas)
- [x] `CLAUDE.md` — project conventions for Claude Code
- [x] `memory-bank/` — persistent context between sessions

---

## Pending

### Real content
- [ ] Define full station list with the botanic garden team
- [ ] Write text for each station
- [ ] Record or source narrated audio per station
- [ ] Photograph or source plant photos

### Missing features
- [ ] Garden map on Home screen (image or SVG)
- [ ] Photo gallery on Station page
- [ ] Welcome screen with offline download instructions
- [ ] Download progress indicator on first visit
- [ ] WebP image support for better performance

### Deploy and QR
- [ ] Deploy to Cloudflare Pages (test domain `.pages.dev`)
- [ ] Generate QR codes for each station
- [ ] Test offline on real devices (iOS and Android)
- [ ] Define final domain

### Optional / future
- [ ] Bilingual support (Spanish / English)
- [ ] Accessibility: adjustable text size
- [ ] Basic analytics (QR scan counts per station)
- [ ] CMS migration if the garden team wants to edit content without touching code
