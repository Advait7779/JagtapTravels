import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    // html2pdf is a dedicated on-demand export chunk; it does not delay the CRM startup bundle.
    chunkSizeWarningLimit: 950,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-core', test: /node_modules[\\/](react|react-dom)[\\/]/, priority: 30 },
            { name: 'motion', test: /node_modules[\\/]framer-motion[\\/]/, priority: 20 },
            {
              name: 'icons',
              test: /node_modules[\\/](@phosphor-icons|lucide-react)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5005', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
