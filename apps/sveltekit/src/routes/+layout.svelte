<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import { theme } from '$stores/theme';

  let { children } = $props();

  onMount(() => {
    theme.init();
  });
</script>

{@render children()}
