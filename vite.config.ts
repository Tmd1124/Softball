import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'

export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:8000' } },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        softball: resolve(import.meta.dirname, 'softball/index.html'),
        workouts: resolve(import.meta.dirname, 'softball/workouts/index.html'),
        basketball: resolve(import.meta.dirname, 'basketball/index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
        reset: resolve(import.meta.dirname, 'reset/index.html'),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      scope: '/softball/workouts/',
      includeAssets: ['icon.svg'],
      workbox: {
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/softball\/videos\/.*\.mp4$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'videos-2026-11-13b',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 40 },
            },
          },
        ],
      },
      manifest: {
        name: 'Catcher Strength & Mobility',
        short_name: 'Catcher',
        description: 'Softball catcher strength, conditioning and mobility schedule',
        theme_color: '#06130b',
        background_color: '#06130b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/softball/workouts/',
        scope: '/softball/workouts/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
