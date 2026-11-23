import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
        ]
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
