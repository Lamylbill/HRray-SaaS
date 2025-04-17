
// src/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      external: ['canvas'], // Skip canvas from build (Netlify safe)
    },
  },
  server: {
    port: 8080,
    host: true, // Listen on all addresses
    allowedHosts: [
      'c2635fb9-456e-4050-97ff-1b481e38168d.lovableproject.com',
      'c2635fb9-456e-4050-97ff-1b481e38168d.lovable.app'
    ],
  },
}));
