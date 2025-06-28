import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills(),
    react(),
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    tailwindcss(),
  ],
  server: {
    port: 3000
  },
  base: './',
  build: {
    outDir: 'dist/react',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
