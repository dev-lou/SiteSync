import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $ui: './src/lib/components/ui',
      $layout: './src/lib/components/layout',
      $widgets: './src/lib/components/widgets',
      $design: './src/lib/design',
      $stores: './src/lib/stores',
      $utils: './src/lib/utils',
    },
  },
};

export default config;
