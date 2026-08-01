import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
export default defineConfig({
  root: resolve(import.meta.dirname),
  envDir: resolve(import.meta.dirname, '../..'),
  plugins: [react()],
  server: { port: 4173, host: '127.0.0.1' },
  preview: { port: 4173, host: '127.0.0.1' },
  build: { outDir: resolve(import.meta.dirname, '../../dist'), emptyOutDir: true },
});
