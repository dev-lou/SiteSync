import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KanbanBoard',
      formats: ['es', 'umd'],
      fileName: (f) => f === 'es' ? 'kanban-board.js' : `kanban-board.${f}.cjs`,
    },
    rollupOptions: {
      external: ['vue', 'convex/browser'],
      output: { globals: { vue: 'Vue', 'convex/browser': 'ConvexClient' } },
    },
  },
});
