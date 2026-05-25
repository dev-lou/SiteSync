<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import Badge from '$ui/Badge.svelte';
  import DataTable from '$ui/DataTable.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import Modal from '$ui/Modal.svelte';
  import Input from '$ui/Input.svelte';
  import Select from '$ui/Select.svelte';
  import WidgetWrapper from '$lib/components/widgets/WidgetWrapper.svelte';
  import { Plus, ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from '@lucide/svelte';
  import { useConvexQuery } from '$stores/convex-query';

  const projectId = $derived($page.data.user?.projectId || '');
  const userId = $derived($page.data.user?.id || '');

  const permitsQuery = $derived(
    projectId ? useConvexQuery('permits:listByProject', { projectId }) : null,
  );
  const zonesQuery = $derived(
    projectId ? useConvexQuery('permits:listZonesByProject', { projectId }) : null,
  );

  const permits = $derived(permitsQuery?.data || []);
  const zones = $derived(zonesQuery?.data || []);
  const loading = $derived(permitsQuery?.loading ?? true);

  let showPermitModal = $state(false);
  let newPermit = $state({ type: '', zoneId: '', description: '' });

  const permitColumns = [
    { key: 'type', label: 'Type', sortable: true },
    { key: 'zoneName', label: 'Zone', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'expiresAt', label: 'Expires', sortable: true },
  ];
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Safety & Permits</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Zone management, permits, and compliance heatmap
      </p>
    </div>
    <Button onclick={() => (showPermitModal = true)}>
      <Plus class="h-4 w-4" />
      <span>New Permit</span>
    </Button>
  </div>

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card padding="lg">
      <div class="flex items-center gap-3 mb-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <ShieldAlert class="h-5 w-5" />
        </div>
        <div>
          <p class="font-medium">Zone Heatmap</p>
          <p class="text-sm text-muted-foreground">SVG floor plan with zone status colors</p>
        </div>
      </div>
      <WidgetWrapper packageName="@sitesync/safety-heatmap" mountFnName="mountSafetyHeatmap" />
    </Card>

    <Card padding="lg">
      <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Active Permits
      </h3>
      <div class="mt-4 space-y-3">
        {#if loading}
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
        {:else}
          {#each permits
            .filter((p) => p.status === 'active' || p.status === 'expiring')
            .slice(0, 5) as permit}
            <div class="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p class="text-sm font-medium">
                  {permit.type} - {permit.zoneName || permit.zoneId}
                </p>
                <p class="text-xs text-muted-foreground">
                  {permit.status === 'expiring' ? 'Expires soon' : 'Expires ' + permit.expiresAt}
                </p>
              </div>
              <Badge variant={permit.status === 'expiring' ? 'warning' : 'success'}>
                {permit.status === 'expiring' ? 'Expiring' : 'Active'}
              </Badge>
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">No active permits.</p>
          {/each}
        {/if}
      </div>
    </Card>
  </div>

  <Card>
    <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      All Permits
    </h3>
    {#if loading}
      <div class="space-y-2">
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>
    {:else}
      <DataTable columns={permitColumns} data={permits} searchable emptyMessage="No permits yet." />
    {/if}
  </Card>
</div>

<Modal bind:open={showPermitModal} title="New Permit">
  <div class="space-y-4">
    <Input label="Permit Type" bind:value={newPermit.type} placeholder="e.g. Hot Work" />
    <Input label="Zone ID" bind:value={newPermit.zoneId} placeholder="Zone identifier" />
    <Input
      label="Description"
      bind:value={newPermit.description}
      placeholder="Brief description..."
    />
    <Button
      onclick={async () => {
        const { mutation } = await import('$utils/convex-types');
        await mutation('permits:createPermit', {
          projectId,
          type: newPermit.type,
          zoneId: newPermit.zoneId,
          description: newPermit.description,
          issuedTo: userId,
        });
        showPermitModal = false;
        newPermit = { type: '', zoneId: '', description: '' };
      }}
    >
      Create Permit
    </Button>
  </div>
</Modal>
