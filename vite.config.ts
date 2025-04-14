
// src/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['canvas'], // Skip canvas from build (Netlify safe)
    },
  },
  server: {
    port: 8080,
    host: true, // Listen on all addresses
  },
});
