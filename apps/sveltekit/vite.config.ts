import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env vars to resolve the Convex site URL
  const env = loadEnv(mode, process.cwd(), '');

  /**
   * Convex HTTP actions are served on the .convex.site domain.
   * VITE_CONVEX_URL typically uses .convex.cloud (the API/data domain).
   * We derive the .site URL for the auth proxy target.
   */
  const convexUrl =
    env.CONVEX_URL ||
    env.VITE_CONVEX_URL?.replace('.convex.cloud', '.convex.site') ||
    'http://localhost:3210';

  return {
    plugins: [tailwindcss(), sveltekit()],
    resolve: {
      conditions: ['development', 'browser'],
    },
    server: {
      host: '127.0.0.1',
      port: 3000,
      strictPort: false,
      hmr: {
        host: '127.0.0.1',
      },
      // Proxy /api/auth requests to Convex HTTP actions.
      // This avoids fetch failing inside the SvelteKit SSR runtime.
      proxy: {
        '/api/auth': {
          target: convexUrl,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
        },
      },
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
  };
});
