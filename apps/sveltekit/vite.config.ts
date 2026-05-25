import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      external: [
        '@sitesync/delivery-tracker',
        '@sitesync/inspection-form',
        '@sitesync/blueprint-viewer',
        '@sitesync/safety-heatmap',
        '@sitesync/kanban-board',
      ],
    },
  },
  ssr: {
    external: [
      '@sitesync/delivery-tracker',
      '@sitesync/inspection-form',
      '@sitesync/blueprint-viewer',
      '@sitesync/safety-heatmap',
      '@sitesync/kanban-board',
    ],
  },
});
