<script lang="ts">
  import { onMount } from 'svelte';
  import { theme } from '$stores/theme';
  import Button from '$ui/Button.svelte';
  import Card from '$ui/Card.svelte';
  import { Sun, Moon } from '@lucide/svelte';

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });
  const isDark = $derived(mounted && $theme === 'dark');
</script>

<div class="flex min-h-dvh flex-col items-center justify-center p-6">
  <div class="mx-auto max-w-lg text-center">
    <h1 class="text-4xl font-bold leading-tight tracking-tight">SiteSync Pro</h1>
    <p class="mt-3 text-lg text-muted-foreground">Real-Time Construction Management Platform</p>

    <div class="mt-4 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" onclick={() => theme.toggle()}>
        <Sun class="h-4 w-4" style="display: {isDark ? 'block' : 'none'}" />
        <Moon class="h-4 w-4" style="display: {isDark ? 'none' : 'block'}" />
        <span class="ml-2">Toggle Theme</span>
      </Button>
    </div>

    <div class="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card variant="interactive" padding="lg">
        <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Delivery Tracker
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">Live material tracking with real-time map</p>
      </Card>

      <Card variant="interactive" padding="lg">
        <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Site Inspections
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">Digital checklist with instant updates</p>
      </Card>

      <Card variant="interactive" padding="lg">
        <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Blueprints
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">Version control & approval workflow</p>
      </Card>

      <Card variant="interactive" padding="lg">
        <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Safety Permits
        </h3>
        <p class="mt-2 text-sm text-muted-foreground">Zone management & compliance heatmap</p>
      </Card>
    </div>
  </div>
</div>
