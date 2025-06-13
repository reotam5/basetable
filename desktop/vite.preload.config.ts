import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'electron/preload.ts'),
      formats: ['cjs'], // required for Electron
      fileName: () => 'preload.cjs',
    },
    outDir: 'dist/main',
    rollupOptions: {
      external: ['electron', 'electron-store'], // do not bundle Electron native modules
    },
    emptyOutDir: false,
  },
});