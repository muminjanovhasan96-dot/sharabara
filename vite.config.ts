/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// GitHub Pages: BASE_PATH=/sharabara/ (see .github/workflows/pages.yml); locally '/'
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Sharabara',
        short_name: 'Sharabara',
        description: 'Sharabara — narx bilan yutadigan marketpleys',
        theme_color: '#F3EDE0',
        background_color: '#F3EDE0',
        display: 'standalone',
        start_url: `${base}m`,
        scope: base,
        icons: [{ src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'], maximumFileSizeToCacheInBytes: 5_000_000 },
    }),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, "src") } },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // rolldown (Vite 8): explicit vendor groups so the mobile app never pulls recharts/xlsx/leaflet
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-is|react-router|react-router-dom|use-sync-external-store|clsx|tailwind-merge)[\\/]/ },
            { name: 'state', test: /node_modules[\\/](immer|zustand)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-[a-z-]+|@reduxjs|redux|reselect|react-redux|victory-vendor|internmap|decimal\.js-light|es-toolkit|eventemitter3|react-smooth|fast-equals|tiny-invariant)[\\/]/ },
            { name: 'map', test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet)[\\/]/ },
            { name: 'xlsx', test: /node_modules[\\/]xlsx[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/types.ts'],
      thresholds: { lines: 90, functions: 90, branches: 80, statements: 90 },
    },
  },
})
