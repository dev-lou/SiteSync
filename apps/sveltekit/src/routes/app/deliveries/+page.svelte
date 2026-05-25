<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import DataTable from '$ui/DataTable.svelte';
  import Badge from '$ui/Badge.svelte';
  import Tabs from '$ui/Tabs.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import Modal from '$ui/Modal.svelte';
  import Input from '$ui/Input.svelte';
  import { Plus, Truck, MapPin, Camera, PenLine } from '@lucide/svelte';
  import { useConvexQuery } from '$stores/convex-query';
  import DeliveryTrackerWrapper from '$lib/components/widgets/DeliveryTrackerWrapper.svelte';

  const projectId = $derived($page.data.user?.projectId || '');
  let activeTab = $state('all');

  const deliveriesQuery = $derived(
    projectId ? useConvexQuery('deliveries:listByProject', { projectId }) : null
  );

  const allDeliveries = $derived(deliveriesQuery?.data || []);
  const loading = $derived(deliveriesQuery?.loading ?? true);

  const deliveries = $derived.by(() => {
    const items = allDeliveries as Array<Record<string, unknown>>;
    if (activeTab === 'all') return items;
    if (activeTab === 'in_transit') return items.filter((d: any) => d.status === 'in_transit' || d.status === 'on_site');
    if (activeTab === 'received') return items.filter((d: any) => d.status === 'received_inspected');
    return items;
  });

  let showCreateModal = $state(false);
  let newDelivery = $state({ title: '', supplier: '', eta: '', materials: '' });

  const columns = [
    { key: 'title', label: 'Material', sortable: true },
    { key: 'supplier', label: 'Supplier', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'eta', label: 'ETA', sortable: true },
  ];

  const tabs = [
    { id: 'all', label: 'All Deliveries' },
    { id: 'in_transit', label: 'Active' },
    { id: 'received', label: 'Received' },
  ];
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Delivery Tracker</h1>
      <p class="mt-1 text-sm text-muted-foreground">Monitor and manage material deliveries in real time</p>
    </div>
    <Button onclick={() => showCreateModal = true}>
      <Plus class="h-4 w-4" />
      <span>New Delivery</span>
    </Button>
  </div>

  <Card>
    <Tabs {tabs} bind:activeTab onchange={(id) => activeTab = id} />
    <div class="mt-4">
      {#if loading}
        <div class="space-y-2">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      {:else}
        <DataTable
          {columns}
          data={deliveries}
          searchable
          emptyMessage="No deliveries yet. Create your first one to get started."
        />
      {/if}
    </div>
  </Card>

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card padding="lg">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Truck class="h-5 w-5" />
        </div>
        <div>
          <p class="font-medium">Live Tracking Map</p>
          <p class="text-sm text-muted-foreground">Truck positions update in real time</p>
        </div>
      </div>
      <div class="mt-4">
        <DeliveryTrackerWrapper />
      </div>
    </Card>

    <Card padding="lg">
      <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Quick Receipt</h3>
      <p class="mt-1 text-sm text-muted-foreground">Confirm material arrival with photo and signature</p>
      <div class="mt-4 flex h-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
        <p class="text-sm text-muted-foreground">Receipt confirmation widget</p>
      </div>
    </Card>
  </div>
</div>

<Modal bind:open={showCreateModal} title="New Delivery">
  <div class="space-y-4">
    <Input label="Material" bind:value={newDelivery.title} placeholder="e.g. Steel beams" />
    <Input label="Supplier" bind:value={newDelivery.supplier} placeholder="e.g. Acme Corp" />
    <Input label="Materials (comma-separated)" bind:value={newDelivery.materials} placeholder="e.g. 10×Steel beams, 5×Concrete blocks" />
    <Input label="ETA (timestamp ms)" bind:value={newDelivery.eta} placeholder="e.g. 1717000000000" />
    <Button onclick={async () => {
      const { mutation } = await import('$utils/convex-types');
      const materials = newDelivery.materials
        ? newDelivery.materials.split(',').map(m => {
            const trimmed = m.trim();
            const match = trimmed.match(/^(\d+)\s*[x×]?\s*(.+)$/i);
            if (match) {
              return { name: match[2].trim(), quantity: parseInt(match[1]), unit: 'ea' };
            }
            return { name: trimmed, quantity: 1, unit: 'ea' };
          })
        : [{ name: newDelivery.title, quantity: 1, unit: 'ea' }];
      await mutation('deliveries:create', {
        projectId,
        title: newDelivery.title,
        supplier: newDelivery.supplier,
        materialList: materials,
        eta: newDelivery.eta ? parseInt(newDelivery.eta) : Date.now() + 86400000,
      });
      showCreateModal = false;
      newDelivery = { title: '', supplier: '', eta: '', materials: '' };
    }}>
      Create Delivery
    </Button>
  </div>
</Modal>
