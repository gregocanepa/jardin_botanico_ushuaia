import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Tamaño máximo por archivo precacheado. Si un archivo lo supera, el build FALLA
// (comportamiento de vite-plugin-pwa 2.x) en vez de dejarlo afuera del modo offline.
// 5 MB ≈ 10 min de narración AAC mono a 64 kbps, ≈ 7 min a 96 kbps.
// Si un audio no entra, revisar la exportación (mono, bitrate) antes de subir el límite.
export const MAX_PRECACHE_FILE_SIZE_MB = 5

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Service worker propio (src/sw.js) en lugar del generado.
      // Hace falta para que el audio precacheado responda a range requests
      // (seek offline y reproducción en iOS Safari). Ver src/sw.js.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      injectManifest: {
        // Todo se precachea en la primera visita (offline en el jardín):
        // archivos del build (JS/CSS/HTML) + audio e imágenes de public/.
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}',
          'audio/*.mp4',
          'images/*.{jpg,jpeg,png,webp}'
        ],
        maximumFileSizeToCacheInBytes: MAX_PRECACHE_FILE_SIZE_MB * 1024 * 1024
      },

      // Browser-only (not installable): no web app manifest.
      // Icons are plain <link> tags in index.html (favicon + apple-touch-icon).
      manifest: false
    })
  ]
})
