<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import Badge from '$ui/Badge.svelte';
  import DataTable from '$ui/DataTable.svelte';
  import Tabs from '$ui/Tabs.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import Modal from '$ui/Modal.svelte';
  import Input from '$ui/Input.svelte';
  import WidgetWrapper from '$lib/components/widgets/WidgetWrapper.svelte';
  import { Plus, FileText, X } from '@lucide/svelte';
  import { useConvexQuery } from '$stores/convex-query';

  let selectedBlueprintId = $state<string | null>(null);

  const projectId = $derived($page.data.user?.projectId || '');
  let activeTab = $state('blueprints');

  const blueprintsQuery = $derived(
    projectId ? useConvexQuery('blueprints:listByProject', { projectId }) : null,
  );
  const changeOrdersQuery = $derived(
    projectId ? useConvexQuery('blueprints:listChangeOrders', { projectId }) : null,
  );

  const blueprints = $derived(blueprintsQuery?.data || []);
  const changeOrders = $derived(changeOrdersQuery?.data || []);
  const loading = $derived(blueprintsQuery?.loading ?? true);

  let showUploadModal = $state(false);
  let newBlueprint = $state({ title: '', description: '' });

  const blueprintColumns = [
    { key: 'title', label: 'Drawing', sortable: true },
    { key: 'currentRevision', label: 'Revision', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];

  const changeOrderColumns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];

  const tabs = [
    { id: 'blueprints', label: 'Blueprints' },
    { id: 'changeOrders', label: 'Change Orders' },
  ];
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Blueprints & Change Orders</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Version-controlled drawings with approval workflow
      </p>
    </div>
    <Button onclick={() => (showUploadModal = true)}>
      <Plus class="h-4 w-4" />
      <span>Upload Blueprint</span>
    </Button>
  </div>

  <Card>
    <Tabs {tabs} bind:activeTab onchange={(id) => (activeTab = id)} />
    <div class="mt-4">
      {#if activeTab === 'blueprints'}
        {#if loading}
          <div class="space-y-2">
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
          </div>
        {:else}
          <DataTable
            columns={blueprintColumns}
            data={blueprints}
            searchable
            emptyMessage="No blueprints yet."
            onrowclick={(row) => (selectedBlueprintId = row._id)}
          />
        {/if}
      {:else}
        <DataTable
          columns={changeOrderColumns}
          data={changeOrders}
          searchable
          emptyMessage="No change orders yet."
        />
      {/if}
    </div>
  </Card>

  <!-- Blueprint Viewer Widget -->
  <Card padding="lg" class="col-span-full">
    {#if selectedBlueprintId}
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <FileText class="h-5 w-5" />
          </div>
          <div>
            <p class="font-medium">Blueprint Viewer</p>
            <p class="text-sm text-muted-foreground">OpenSeadragon deep-zoom viewer</p>
          </div>
        </div>
        <button
          onclick={() => (selectedBlueprintId = null)}
          class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <WidgetWrapper
        packageName="@sitesync/blueprint-viewer"
        mountFnName="mountBlueprintViewer"
        additionalProps={{ blueprintId: selectedBlueprintId }}
      />
    {:else}
      <div class="flex items-center gap-3 mb-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <FileText class="h-5 w-5" />
        </div>
        <div>
          <p class="font-medium">Blueprint Viewer</p>
          <p class="text-sm text-muted-foreground">
            Click a blueprint above to open the deep-zoom viewer
          </p>
        </div>
      </div>
      <div
        class="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/30"
      >
        <p class="text-sm text-muted-foreground">Select a blueprint to view</p>
      </div>
    {/if}
  </Card>
</div>

<Modal bind:open={showUploadModal} title="Upload Blueprint">
  <div class="space-y-4">
    <Input
      label="Title"
      bind:value={newBlueprint.title}
      placeholder="e.g. Structural Foundation Plan"
    />
    <Input
      label="Description"
      bind:value={newBlueprint.description}
      placeholder="Brief description..."
    />
    <Button
      onclick={async () => {
        const { mutation } = await import('$utils/convex-types');
        await mutation('blueprints:create', {
          projectId,
          title: newBlueprint.title,
          description: newBlueprint.description,
        });
        showUploadModal = false;
        newBlueprint = { title: '', description: '' };
      }}
    >
      Create Blueprint
    </Button>
  </div>
</Modal>
