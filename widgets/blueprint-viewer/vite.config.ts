import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BlueprintViewer',
      formats: ['es', 'umd'],
      fileName: (f) => (f === 'es' ? 'blueprint-viewer.js' : `blueprint-viewer.${f}.cjs`),
    },
    rollupOptions: {
      external: ['vue', 'convex/browser', 'openseadragon'],
      output: {
        globals: { vue: 'Vue', 'convex/browser': 'ConvexClient', openseadragon: 'OpenSeadragon' },
      },
    },
  },
});
