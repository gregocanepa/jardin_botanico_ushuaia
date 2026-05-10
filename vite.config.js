import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // Precachea archivos estáticos de public/ durante el build.
      // Estos glob patterns se resuelven desde la carpeta public/.
      includeAssets: [
        'favicon.ico',
        'icons/*.png',
        'audio/*.mp3',
        'images/*.jpg',
        'images/*.png',
        'images/*.webp'
      ],

      workbox: {
        // Archivos del build (JS/CSS/HTML) + archivos de public/
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}',
          'audio/*.mp3',
          'images/*.{jpg,png,webp}'
        ],

        runtimeCaching: [
          {
            // Audios: cache-first con soporte de range requests.
            // El elemento <audio> usa range requests para el seek —
            // sin rangeRequests: true, avanzar en la barra falla offline.
            urlPattern: /\/audio\/.+\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              rangeRequests: true,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            // Imágenes: cache-first, sin necesidad de range requests
            urlPattern: /\/images\/.+\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
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
