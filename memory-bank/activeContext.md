# Active Context

> **Update this file at the start and end of every work session.**
> It reflects what's currently in progress and any open decisions.

## Last updated
Initial version — base project structure created.

## Current focus
Base project structure is complete. Next step is getting the real garden content (plants, texts, audio, photos) to replace the sample data.

## Immediate next tasks
- [ ] Add real stations to `src/data/stations.json`
- [ ] Upload real audio files to `public/audio/`
- [ ] Upload real photos to `public/images/`
- [ ] Build the garden map for the Home screen
- [ ] Add photo gallery component to the Station page
- [ ] Initial deploy to Cloudflare Pages for testing

## Open decisions
- How many stations will the full tour have?
- Will the garden map be a static image or an interactive SVG?
- Should there be a download progress indicator when the visitor first opens the app?

## Last session summary
- Created full project structure with React + Vite + vite-plugin-pwa
- Configured offline with Workbox (CacheFirst for audio and images, rangeRequests for audio)
- Built two sample stations: Orquídeas and Cactáceas
- Created visual prototype of the station page with functional audio player
- Built pitch deck for funding presentation (8 slides, .pptx)
- Created CLAUDE.md and memory-bank for persistent Claude Code context
