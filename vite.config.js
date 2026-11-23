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

      includeAssets: [
        'favicon.ico',
        'icons/*.png'
      ],

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

      manifest: {
        name: 'Jardín Botánico — Recorrido Autoguiado',
        short_name: 'Jardín Botánico',
        description: 'Recorrido autoguiado por el jardín botánico. Funciona sin internet.',
        theme_color: '#4A6741',
        background_color: '#F5EDE0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
