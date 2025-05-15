
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
      external: ['canvas', 'stripe', 'micro'], // Add stripe and micro to external
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
  // Define environment variables so TypeScript knows they exist
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://ezvdmuahwliqotnbocdd.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmRtdWFod2xpcW90bmJvY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMjAzMTksImV4cCI6MjA1Nzc5NjMxOX0.NjZ8o0b71gTScc2B2yoB_dNzDXHZrV8RP1T13WX2I3U'),
  }
}));
