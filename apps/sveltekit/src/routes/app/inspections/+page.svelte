<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import Badge from '$ui/Badge.svelte';
  import DataTable from '$ui/DataTable.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import WidgetWrapper from '$lib/components/widgets/WidgetWrapper.svelte';
  import { Plus, ClipboardCheck, X } from '@lucide/svelte';
  import { useConvexQuery } from '$stores/convex-query.svelte';

  const projectId = $derived($page.data.user?.projectId || '');
  const userId = $derived($page.data.user?.id || '');
  const userRole = $derived($page.data.user?.role || 'field_engineer');

  const inspectionsQuery = $derived(
    projectId ? useConvexQuery('inspections:listByProject', { projectId }) : null,
  );
  const myInspectionsQuery = $derived(
    userId ? useConvexQuery('inspections:listByAssignee', { assigneeId: userId }) : null,
  );

  const inspections = $derived(inspectionsQuery?.data || []);
  const loading = $derived(inspectionsQuery?.loading ?? true);

  let selectedInspectionId = $state<string | null>(null);

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'assigneeId', label: 'Assignee', sortable: true },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Site Inspections</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Digital checklists with real-time updates and audit trail
      </p>
    </div>
    <Button>
      <Plus class="h-4 w-4" />
      <span>New Inspection</span>
    </Button>
  </div>

  {#if myInspectionsQuery?.data?.length}
    <Card padding="md">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        My Inspections
      </h3>
      <div class="space-y-2">
        {#each myInspectionsQuery.data as insp}
          <div class="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p class="text-sm font-medium">{insp.title}</p>
              <p class="text-xs text-muted-foreground">Status: {insp.status}</p>
            </div>
            <Badge
              variant={insp.status === 'passed'
                ? 'success'
                : insp.status === 'in_progress'
                  ? 'warning'
                  : 'outline'}
            >
              {insp.status}
            </Badge>
          </div>
        {/each}
      </div>
    </Card>
  {/if}

  <Card>
    <div class="flex items-center justify-between border-b border-border pb-3">
      <h3 class="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        All Inspections
      </h3>
    </div>
    <div class="mt-4">
      {#if loading}
        <div class="space-y-2">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      {:else}
        <DataTable
          {columns}
          data={inspections}
          searchable
          emptyMessage="No inspections yet."
          onrowclick={(row) => (selectedInspectionId = row._id as string)}
        />
      {/if}
    </div>
  </Card>

  <!-- Inspection Form Widget -->
  <Card padding="lg">
    {#if selectedInspectionId}
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <ClipboardCheck class="h-5 w-5" />
          </div>
          <div>
            <p class="font-medium">Inspection Form</p>
            <p class="text-sm text-muted-foreground">Real-time checklist with pass/fail toggles</p>
          </div>
        </div>
        <button
          onclick={() => (selectedInspectionId = null)}
          class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <WidgetWrapper
        packageName="@sitesync/inspection-form"
        mountFnName="mountInspectionForm"
        additionalProps={{ inspectionId: selectedInspectionId }}
      />
    {:else}
      <div class="flex items-center gap-3 mb-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <ClipboardCheck class="h-5 w-5" />
        </div>
        <div>
          <p class="font-medium">Inspection Form</p>
          <p class="text-sm text-muted-foreground">Click an inspection above to open the form</p>
        </div>
      </div>
      <div
        class="mt-4 flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/30"
      >
        <p class="text-sm text-muted-foreground">Select an inspection to start working</p>
      </div>
    {/if}
  </Card>
</div>
