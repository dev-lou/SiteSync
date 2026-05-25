import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DeliveryTracker',
      formats: ['es', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'delivery-tracker.js' : `delivery-tracker.${format}.cjs`,
    },
    rollupOptions: {
      external: ['vue', 'convex/browser'],
      output: {
        globals: {
          vue: 'Vue',
          'convex/browser': 'ConvexClient',
        },
      },
    },
  },
});
