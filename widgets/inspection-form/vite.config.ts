import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'InspectionForm',
      formats: ['es', 'umd'],
      fileName: (f) => (f === 'es' ? 'inspection-form.js' : `inspection-form.${f}.cjs`),
    },
    rollupOptions: {
      external: ['vue', 'convex/browser'],
      output: { globals: { vue: 'Vue', 'convex/browser': 'ConvexClient' } },
    },
  },
});
