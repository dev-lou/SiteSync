<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { theme } from '$stores/theme';
  import { ArrowLeft, Home, AlertTriangle, FileQuestion } from '@lucide/svelte';

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  const status = $derived($page.status);
  const is404 = $derived(status === 404);

  const errorTitle = $derived(is404 ? 'Page Not Found' : 'Something Went Wrong');
  const errorMessage = $derived(
    is404
      ? "The page you're looking for doesn't exist or has been moved."
      : 'An unexpected error occurred. Our team has been notified.',
  );
  const errorIcon = $derived(is404 ? FileQuestion : AlertTriangle);
</script>

<svelte:head>
  <title>{errorTitle} — SiteSync Pro</title>
</svelte:head>

<div class="flex min-h-dvh flex-col items-center justify-center bg-background p-6">
  <div class="flex flex-col items-center text-center max-w-md">
    <!-- Icon -->
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
      {#if mounted}
        {@const Icon = errorIcon}
        <Icon class="h-8 w-8 text-muted-foreground" />
      {/if}
    </div>

    <!-- Status code -->
    <p class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      Error {status}
    </p>

    <!-- Title -->
    <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground">
      {errorTitle}
    </h1>

    <!-- Message -->
    <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
      {errorMessage}
    </p>

    <!-- Actions -->
    <div class="mt-8 flex items-center gap-3">
      <button
        onclick={() => {
          if (globalThis.history.length > 1) {
            history.back();
          } else {
            window.location.href = '/app';
          }
        }}
        class="focus-ring inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        Go Back
      </button>
      <a
        href="/app"
        class="focus-ring inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Home class="h-4 w-4" />
        Dashboard
      </a>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
  }
</style>
