<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { theme } from '$stores/theme';

  let { children } = $props();

  onMount(() => {
    theme.init();
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[Dev] Unregistered service worker to prevent stale caching:', registration);
        }
      });
    }
  });
</script>

{@render children()}
