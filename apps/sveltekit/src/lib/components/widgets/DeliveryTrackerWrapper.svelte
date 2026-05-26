<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { convexUrl } from '$stores/convex';
  import { waitForWidget } from '$lib/utils/widget-loader';

  let container = $state<HTMLDivElement | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const { mountDeliveryTracker } = await import('@sitesync/delivery-tracker');
      mountDeliveryTracker(container!, {
        convexUrl: $convexUrl,
        projectId: $page.params.projectId || $page.data.user?.projectId || '',
        userId: $page.data.user?.id || '',
        userRole: $page.data.user?.role || 'field_engineer',
      });
      loading = false;
    } catch (err) {
      error = `Failed to load Delivery Tracker: ${(err as Error).message}`;
      loading = false;
    }
  });
</script>

<div class="delivery-tracker-widget">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      ></div>
    </div>
  {:else if error}
    <div class="rounded-md border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
      {error}
    </div>
  {:else}
    <div bind:this={container}></div>
  {/if}
</div>
