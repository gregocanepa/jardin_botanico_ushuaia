# Production Readiness — Task List

Everything needed to take the Jardín Botánico tour app from MVP to something real visitors can rely on.
Based on an audit of the current repo (branch `feature/loading-screen`) and `CLAUDE.md`.

> **Scope decision:** the app will **not** be an installable app (no "Add to Home Screen" / install prompt) for now. Visitors use it in their **phone browser** after scanning a QR. The service worker is still used for offline caching — offline works in a normal browser tab, it just isn't tied to an installed app. Install-related work is deferred to §12.

**Priority legend**
- **P0** — Blocker. The app is broken or unsafe in production without it.
- **P1** — Required for launch. Real users will hit this.
- **P2** — Should have soon after launch.
- **P3** — Nice to have / future.

---

## 0. Bugs and inconsistencies found in the current code (fix first)

- [ ] **P1** — Icons are missing. `public/favicon.ico` and `public/icons/icon-192.png` / `icon-512.png` don't exist, but `index.html` and `vite.config.js` reference them → 404s in the console and a blank browser-tab icon. Add a favicon (+ `apple-touch-icon` for bookmarks). Since the app isn't installable, either set `manifest: false` in vite-plugin-pwa (keep only the service worker) or keep a minimal valid manifest for later — don't ship one that references missing files.
- [ ] **P0** — Image paths don't match. `stations.json` and `vite.config.js` use `/assets/images/...`, `CLAUDE.md` says `/images/...`, and `public/images/` doesn't exist. Pick one convention (`/images/` per CLAUDE.md), update JSON, `includeAssets`, `globPatterns` and the `images-cache` `urlPattern`.
- [ ] **P0** — Audio is both precached (`globPatterns: 'audio/*.mp4'`) and handled by a runtime `CacheFirst` route with `rangeRequests`. Precached files are served by the precache route, which **does not honour Range requests** → seeking (and on iOS Safari, playback itself) can fail offline. Decide on one strategy: either precache audio and add a range-request plugin to the precache route, or don't precache audio and warm the runtime cache explicitly.
- [ ] **P0** — Workbox's default `maximumFileSizeToCacheInBytes` is 2 MB. Real narration files will be larger and will be **silently dropped** from the precache. Set an explicit limit and fail the build if an asset exceeds it.
- [ ] **P0** — `OfflineBanner` marks content as cached (`localStorage 'offline-cached'`) after a 2.7 s timeout even if the service worker never finished. Users get told "ready for offline" when nothing is cached. (Comment says 20 s, code says 2700 ms.) The progress bar is also fake (animates to 75 % regardless).
- [ ] **P0** — There is no React Error Boundary. Any runtime error (e.g. a missing translation in `stations.json`) produces a blank white screen with no way out.
- [ ] **P1** — `Station.jsx` renders the raw developer string (`Station "x" not found`) on a bad slug instead of the `NotFound` page. An outdated/misprinted QR shows English debug text.
- [ ] **P1** — `useStation.resolve()` assumes every field exists for every language. A missing `facts.en` → `Object.entries(undefined)` → crash. Needs fallback to Spanish + build-time validation (see §3).
- [ ] **P1** — `AudioPlayer`: `audio.play()` promise is not handled (rejected promise when the file is missing/not cached/blocked), there's no `error` listener, `playing` state is toggled before knowing if playback started, and state isn't reset when `src` changes (switching language mid-playback leaves the UI out of sync).
- [ ] **P1** — `audioDuration` is hardcoded in JSON (and the current sample files don't match "2:34"/"2:10"). Read real duration from `loadedmetadata`, keep JSON value only as a fallback.
- [ ] **P1** — `index.html` sets `maximum-scale=1.0`, which blocks pinch-zoom (WCAG 1.4.4 failure). Remove it.
- [ ] **P1** — `localStorage` access is unguarded in `OfflineBanner` and `LanguageContext`. It throws in some private-browsing modes / restricted WebViews (e.g. QR scanner in-app browsers) → app crashes on load.
- [ ] **P1** — Navigating "Siguiente →" keeps the scroll position at the bottom of the page. Add scroll-to-top on route change.
- [ ] **P1** — `NotFound.jsx` is not translated, uses inline styles and a hardcoded color (`#FAEEDA`). Move to CSS Module + i18n strings.
- [ ] **P1** — Hardcoded colors in CSS Modules violate the CLAUDE.md rule (≈20 occurrences in `Station`, `Home`, `AudioPlayer`, `LanguageToggle`, `OfflineBanner` modules). Add missing tokens to `index.css` and replace.
- [ ] **P1** — `<html lang="es">` never changes when the user switches to English (screen readers mispronounce everything). Update `document.documentElement.lang` on toggle.
- [ ] **P1** — Accessibility labels are single-language (`'Pausar audio'` in Spanish, `'Change language'` in English). Move all ARIA labels to `i18n/strings.js`.
- [ ] **P2** — Home ships a "Mapa del jardín — Próximamente" placeholder. Either build the map or remove the placeholder for launch.
- [ ] **P2** — `scientificName` ("Familia Orchidaceae") is Spanish-only; translate the "Familia/Family" prefix or store only the taxon.
- [ ] **P2** — `images` field exists in JSON but is never rendered.
- [ ] **P2** — README is outdated (says assets go in `src/assets/`, audio as `.mp3`). Audio is actually `.mp4`; align README, CLAUDE.md and memory-bank with reality.
- [ ] **P2** — `npm audit` reports 3 moderate vulnerabilities. Review and fix.

---

## 1. Offline & service worker (the core promise of the app)

- [ ] **P0** — Decide the download model: precache **everything** on first visit (simple, but big download) vs. "Download tour" button with explicit consent. Given no signal in the garden, precache-all is probably right; document the total size.
- [ ] **P0** — Real download progress: track actual precache progress (number of assets cached / total) instead of a timed animation. Only mark "ready" when the SW reports `offlineReady` **and** a verification check passes (all station audio/images present in Cache Storage).
- [ ] **P0** — Handle the "visitor scans a QR inside the garden with no connection and the app was never cached" case: clear message explaining they need to open the app at the entrance Wi-Fi, instead of a browser error page. (Cloudflare can't help here — this must be solved with signage + a pre-visit flow.)
- [ ] **P0** — Handle partial/failed downloads: connection drops halfway → show an error state with a "Retry" button, don't flag as complete.
- [ ] **P1** — Request persistent storage (`navigator.storage.persist()`) so the browser doesn't evict the cache mid-visit. Note: browsers grant this less readily for non-installed sites, so treat it as best effort and don't rely on it. Show storage estimate (`navigator.storage.estimate()`) and warn if there isn't enough space.
- [ ] **P1** — iOS Safari evicts script-writable storage for sites not used in 7 days. Fine for a same-day visit, but document it (a visitor who opened the link days before won't have the content cached).
- [ ] **P1** — Caches are per browser: content cached in Chrome isn't available in Samsung Internet or a QR-scanner's in-app browser. The visitor must open the entrance QR and the station QRs in the **same browser**. Communicate this on the entrance sign/welcome screen (see §2 in-app browser detection).
- [ ] **P1** — Update strategy: `registerType: 'autoUpdate'` can reload the page while a visitor is mid-tour or mid-audio. Switch to `prompt` (show "New content available — Update" banner) or only apply updates on the Home screen when audio isn't playing.
- [ ] **P1** — Enable `cleanupOutdatedCaches` and version cache names so old audio/images are removed when content changes.
- [ ] **P1** — Make sure `navigateFallback` serves `index.html` for `/estacion/*` offline, and that the `NotFound` route works offline.
- [ ] **P1** — Offline indicator: small, non-intrusive banner when the device is offline *and* some content isn't cached.
- [ ] **P1** — Show "available offline ✓" state per station (or globally) so visitors can trust it before walking in.
- [ ] **P2** — "Re-download / repair content" option in a settings/info screen.
- [ ] **P2** — Don't show the full-screen loading overlay on every deep link; on a QR deep-link with content already cached, go straight to the station.

---

## 2. Error handling & resilience

- [ ] **P0** — Global `ErrorBoundary` around routes with a friendly bilingual fallback ("Something went wrong — Back to tour" + reload button).
- [ ] **P1** — Per-section boundaries (audio player, gallery, map) so one broken component doesn't take down the page.
- [ ] **P1** — Audio error states: file missing, not cached while offline, unsupported codec, playback blocked. Each with a user-facing message and retry.
- [ ] **P1** — Audio loading/buffering state (spinner on play button while `waiting`).
- [ ] **P1** — Image error handling: `onError` fallback placeholder, never a broken-image icon.
- [ ] **P1** — Unknown slug → `NotFound` page with link to the station list (bilingual). Consider fuzzy-matching/redirect map for renamed slugs so old QR codes keep working.
- [ ] **P1** — Global `window.onerror` / `unhandledrejection` handlers feeding error reporting (§7).
- [ ] **P1** — Feature detection with graceful degradation: no service worker support (old browsers, some in-app browsers) → app still works online and tells the user offline isn't available.
- [ ] **P1** — Detect in-app browsers (Instagram, WhatsApp, some QR scanner apps) where SW/caching is unreliable or isolated from the main browser, and suggest "Open in Chrome/Safari". (Raised from P2: with no installed app, the browser *is* the app, so landing in the wrong one breaks offline.)

---

## 3. Data & content integrity

- [ ] **P0** — JSON schema for `stations.json` + a validation script run on `npm run build` and in CI. Fail the build if: required fields are missing, a language is missing, slugs are duplicated or not URL-safe, `order` is duplicated, `id` is duplicated.
- [ ] **P0** — Asset existence check at build time: every `audio` and `images` path in the JSON must exist in `public/`. Fail the build otherwise.
- [ ] **P1** — Asset size check: fail/warn if any audio or image exceeds a budget (see §6).
- [ ] **P1** — Slug stability policy: slugs are printed on physical QR codes — once printed, never change them. Add a redirects map (old slug → new slug) for the rare case it's unavoidable.
- [ ] **P1** — Link checker for external `links` (Wikipedia, iNaturalist) in CI on a schedule; mark them as "requires internet" in the UI.
- [ ] **P1** — Content workflow doc: how garden staff send new text/audio/photos, who reviews scientific accuracy, who translates, who approves.
- [ ] **P2** — Content editing without code (e.g. a simple Git-based CMS like Decap/Tina, or a spreadsheet → JSON script) if garden staff will edit content themselves.

---

## 4. Real content (non-code, but blocks launch)

- [ ] **P0** — Final station list with the garden team (number of stations, order, physical locations).
- [ ] **P0** — Texts per station in Spanish and English, reviewed by a botanist.
- [ ] **P0** — Narrated audio per station per language. Define format/bitrate (e.g. AAC/M4A mono 64–96 kbps) and loudness normalization so volume is consistent across stations.
- [ ] **P0** — Photos per station with rights cleared. Define naming (`{slug}-1.jpg`) and dimensions.
- [ ] **P1** — Audio transcripts (accessibility requirement — the description text may already serve this; confirm it matches the narration).
- [ ] **P1** — Alt text for every image, both languages.
- [ ] **P1** — Credits/attribution for photos, voice talent, sources.
- [ ] **P1** — Replace sample content (orquídeas/cactáceas are placeholders — likely not even in a Ushuaia garden). Consider native Fueguian flora.

---

## 5. Missing features required for launch

- [ ] **P1** — Photo gallery on the Station page (swipeable, lazy, with captions/credits, works offline).
- [ ] **P1** — Garden map on Home (static image or SVG) showing station locations and the recommended route. Must work offline.
- [ ] **P1** — Welcome / onboarding screen: explains "download at the entrance on Wi-Fi", shows download status, language choice, how to scan QRs.
- [ ] **P1** — About / info page: garden hours, contact, credits, privacy policy link, app version.
- [ ] **P1** — Auto-detect initial language from `navigator.language` (default Spanish), still remember user choice.
- [ ] **P1** — Per-page `document.title` (e.g. "Orquídeas — Jardín Botánico") for history, tabs and screen readers.
- [ ] **P2** — Tour progress: mark visited stations (localStorage), show "x of N visited".
- [ ] **P2** — Media Session API so audio controls appear on the lock screen and keep playing with the screen off.
- [ ] **P2** — Previous-station button (currently only "Next").
- [ ] **P3** — In-app QR scanner (most phones' cameras already do this; low priority).
- [ ] **P3** — Adjustable text size.

---

## 6. Performance

- [ ] **P1** — Define a total download budget (e.g. < 50 MB for the whole tour) and measure it in CI.
- [ ] **P1** — Image pipeline: resize to max ~1200 px, convert to WebP/AVIF with JPEG fallback, `srcset`/`sizes`, `loading="lazy"`, explicit `width`/`height` to avoid layout shift.
- [ ] **P1** — Audio compression: mono, low bitrate speech encoding; verify plays on iOS Safari (AAC in .m4a/.mp4 is safe; check the MIME type served by Cloudflare).
- [ ] **P1** — Lighthouse targets (Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95) run in CI (Lighthouse CI). Installability is not a target.
- [ ] **P2** — Code-split routes (`React.lazy`) if the bundle grows; currently small, verify with `vite build --report`.
- [ ] **P2** — `stations.json` is bundled into JS. Fine for tens of stations; revisit if content gets large.
- [ ] **P2** — Self-host/system fonts only (already system fonts — keep it that way, no web font network requests).

---

## 7. Monitoring, analytics & observability

- [ ] **P1** — Error reporting (e.g. Sentry free tier, or a minimal Cloudflare Worker endpoint) with **offline queueing**: errors happen in the garden with no signal, so buffer them and send when back online. Strip PII.
- [ ] **P1** — Privacy-friendly analytics (Cloudflare Web Analytics — cookieless, free, no consent banner needed). Track: visits, QR deep-link hits per station, language split, offline-ready completion rate.
- [ ] **P1** — Uptime monitoring for the production domain (e.g. UptimeRobot / Cloudflare health checks).
- [ ] **P2** — Track audio plays/completions per station (offline-buffered) to learn which stations engage.
- [ ] **P2** — Show app version + build hash in the About page and in error reports.

---

## 8. Security

- [ ] **P1** — `public/_headers` for Cloudflare Pages with security headers:
  - `Content-Security-Policy` (`default-src 'self'`; allow only what's needed — analytics/Sentry endpoints)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (disable camera, mic, geolocation, etc. unless used)
  - `X-Frame-Options: DENY` / `frame-ancestors 'none'`
  - `Strict-Transport-Security` (once the custom domain is final)
- [ ] **P1** — Cache headers in `_headers`: `sw.js`, `index.html` (and `manifest.webmanifest` if kept) → `no-cache`; hashed `/assets/*` → `immutable, max-age=31536000`. A cached `sw.js` can lock users on an old version.
- [ ] **P1** — External links already use `rel="noopener noreferrer"` ✓ — keep it enforced (lint rule).
- [ ] **P1** — Dependency hygiene: Dependabot/Renovate, `npm audit` in CI, lockfile committed ✓.
- [ ] **P1** — Plan dependency upgrades (Vite 5 → current, vite-plugin-pwa 0.19 → current, React Router 6 → 7 optional). Vite 5 is several majors behind; check security support.
- [ ] **P2** — Subresource/QR integrity: QR codes should point to a domain the garden controls long-term (don't print `*.pages.dev`). Losing the domain = someone else controls every printed QR.
- [ ] **P2** — GitHub repo: branch protection on `main`, required CI checks, 2FA for all collaborators, restricted Cloudflare account access.

---

## 9. Accessibility (WCAG 2.1 AA)

- [ ] **P1** — Audio progress bar is a click-only `div role="progressbar"`. Make it a proper `slider` (or `<input type="range">`) — keyboard operable, touch-draggable, announces time.
- [ ] **P1** — Allow zoom (remove `maximum-scale`, see §0).
- [ ] **P1** — Color contrast audit for all text, especially muted text (`#8A7060` on white/cream) and text over the hero. Also test in **bright outdoor sunlight**.
- [ ] **P1** — Visible focus styles on all interactive elements (reset currently removes button styling).
- [ ] **P1** — Tap targets ≥ 44×44 px (visitors in Ushuaia may be wearing gloves).
- [ ] **P1** — `prefers-reduced-motion` support for the loading animation and transitions.
- [ ] **P1** — Semantic structure: one `h1` per page, list markup for the station list, landmarks (`main`, `nav`).
- [ ] **P1** — Screen-reader pass with VoiceOver (iOS) and TalkBack (Android).
- [ ] **P2** — Station list items are `<button>` + `navigate()`; use `<Link>` so they behave like links (long-press, open in new tab, correct semantics).

---

## 10. Testing & quality

- [ ] **P1** — ESLint (+ `eslint-plugin-react-hooks`, `jsx-a11y`) and Prettier, enforced in CI.
- [ ] **P1** — Unit tests (Vitest + Testing Library): `useStation` (missing slug, missing language, fallback), `AudioPlayer` states, `LanguageContext`, `ErrorBoundary`.
- [ ] **P1** — E2E tests (Playwright) on the **production build**: home → station → next, deep link to `/estacion/:slug`, unknown slug, language toggle, offline mode (Playwright can set offline) including audio playback and seeking from cache.
- [ ] **P1** — Real-device test matrix: iOS Safari (latest + one older), Android Chrome, Samsung Internet, a low-end Android; in the browser only (no install); airplane-mode test after first load, including closing and reopening the browser tab and scanning a station QR from the camera app.
- [ ] **P1** — **Field test in the garden**: walk the full tour with no signal, scan every physical QR, check audio volume outdoors, sunlight readability, battery drain.
- [ ] **P2** — Consider TypeScript or JSDoc types for the station data shape.
- [ ] **P2** — Pin Node version (`.nvmrc` + `engines` in `package.json`) so local, CI and Cloudflare build identically.

---

## 11. CI/CD & deployment

- [ ] **P0** — Create the Cloudflare Pages project connected to GitHub (build `npm run build`, output `dist`), set Node version env var.
- [ ] **P1** — GitHub Actions pipeline on every PR: install → lint → validate content → unit tests → build → E2E (offline) → Lighthouse CI → bundle/asset size check.
- [ ] **P1** — Preview deployments per branch/PR (Cloudflare does this automatically) used for review before merging.
- [ ] **P1** — SPA routing: confirm Cloudflare Pages serves `index.html` for `/estacion/*` on a fresh (non-SW) load; add `public/_redirects` (`/* /index.html 200`) if needed. Make sure it doesn't swallow `sw.js`, the manifest or assets.
- [ ] **P1** — Custom domain owned by the garden/organization, HTTPS, `www` → apex redirect.
- [ ] **P1** — Rollback procedure documented (Cloudflare Pages "rollback to previous deployment") + note that SW clients may need an update cycle to pick it up.
- [ ] **P2** — Staging environment (e.g. `staging.` subdomain) separate from production QR domain.
- [ ] **P2** — Release versioning/tagging + CHANGELOG.

---

## 12. Browser polish (+ deferred install work)

- [ ] **P1** — Favicon (ico + svg) and 180×180 `apple-touch-icon` (used for bookmarks/tabs).
- [ ] **P1** — `theme-color` meta tag matched to the design (colors the mobile browser address bar).
- [ ] **P2** — Open Graph / Twitter meta tags and a share image for when the link is shared on WhatsApp/social.

**Deferred — only if the app becomes installable later (P3):**
- [ ] **P3** — Full icon set: 192, 512, **separate maskable icon** with safe-zone padding.
- [ ] **P3** — Manifest: add `id`, `scope`, `lang`, `categories`, `screenshots`.
- [ ] **P3** — iOS splash screens (`apple-touch-startup-image`) and `apple-mobile-web-app-status-bar-style`.
- [ ] **P3** — Custom "Install app" prompt (Android `beforeinstallprompt`) + iOS "Add to Home Screen" instructions.

---

## 13. Physical QR codes & on-site

- [ ] **P0** — QR codes point to the **final custom domain** (`https://<domain>/estacion/{slug}`), never a `.pages.dev` URL.
- [ ] **P1** — Script to generate all QR codes from `stations.json` (SVG, high error correction level) so they stay in sync with slugs.
- [ ] **P1** — Print the short URL under each QR as a fallback for phones that fail to scan.
- [ ] **P1** — Weather-resistant signage (Ushuaia: rain, snow, UV, cold) and placement tested for scanning distance/angle.
- [ ] **P0** — Entrance sign with a QR to the home page + clear instruction: "Connect to Wi-Fi and open the app **before** entering — the garden has no signal."
- [ ] **P1** — Confirm with the garden whether entrance Wi-Fi exists and its bandwidth (affects total download budget).
- [ ] **P2** — Track QR → deep-link hits per station via analytics (e.g. `?src=qr` param) to detect damaged/unscannable signs.

---

## 14. Legal & privacy

- [ ] **P1** — Privacy policy (bilingual) covering analytics, error reporting and localStorage use; compliant with Argentina's Ley 25.326 (Protección de Datos Personales).
- [ ] **P1** — Rights/licenses for all photos, audio narration (voice talent release), and texts. Credit page.
- [ ] **P1** — Ownership agreement: who owns the domain, Cloudflare account, GitHub repo and content (garden vs. developer).
- [ ] **P2** — Terms of use / disclaimer (e.g. "don't touch plants", safety notes) if the garden wants it.

---

## 15. Documentation & operations

- [ ] **P1** — Update README (correct asset paths, audio format, how to add a station, how to test offline, how to deploy).
- [ ] **P1** — "Add / edit a station" guide for non-developers (step by step, including asset specs and QR generation).
- [ ] **P1** — Runbook: what to do if the site is down, content is wrong, a QR is broken, users report "doesn't work offline".
- [ ] **P1** — Keep `memory-bank/` and `CLAUDE.md` in sync with the decisions above (asset paths, audio format, offline strategy).
- [ ] **P2** — Support channel for visitors (email shown in the About page) and a way for garden staff to report issues.

---

## Suggested order of work

1. **§0 bugs** (asset paths, audio caching, fake "ready" state, error boundary, missing icons)
2. **§1 offline correctness** + **§2 error handling**
3. **§3 content validation** + **§10 tests/CI** + **§11 deploy pipeline**
4. **§8 security headers** + **§12 browser polish**
5. **§5 features** (gallery, map, onboarding) in parallel with **§4 real content**
6. **§9 accessibility** + **§6 performance** passes
7. **§7 monitoring**, **§14 legal**, **§15 docs**
8. **§13 QR printing** → real-device + in-garden field test → launch
