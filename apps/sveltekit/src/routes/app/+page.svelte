<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$ui/Card.svelte';
  import Badge from '$ui/Badge.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import { Package, ClipboardCheck, FileText, ShieldAlert, Kanban } from '@lucide/svelte';
  import { useConvexQuery } from '$stores/convex-query.svelte';

  const projectId = $derived($page.data.user?.projectId || '');

  const deliveryCounts = $derived(
    projectId ? useConvexQuery('deliveries:getDeliveryCounts', { projectId }) : null,
  );
  const inspectionCounts = $derived(
    projectId ? useConvexQuery('inspections:getCounts', { projectId }) : null,
  );
  const permitStats = $derived(
    projectId ? useConvexQuery('permits:getPermitStats', { projectId }) : null,
  );
  const myTasks = $derived(
    $page.data.user?.id
      ? useConvexQuery('kanban:getMyTasks', { userId: $page.data.user.id, projectId })
      : null,
  );
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <a href="/app/deliveries">
      <Card variant="interactive" padding="lg">
        <div class="flex items-start justify-between">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Package class="h-5 w-5" />
          </div>
          {#if deliveryCounts?.loading}
            <Skeleton class="h-5 w-16" />
          {:else if deliveryCounts?.data}
            {#if deliveryCounts.data.expiringSoon}
              <Badge variant="warning">{deliveryCounts.data.expiringSoon} in transit</Badge>
            {/if}
          {/if}
        </div>
        {#if deliveryCounts?.loading}
          <Skeleton class="mt-4 h-8 w-12" />
        {:else if deliveryCounts?.data}
          <p class="mt-4 text-2xl font-bold">{deliveryCounts.data.active}</p>
        {:else}
          <p class="mt-4 text-2xl font-bold">&mdash;</p>
        {/if}
        <p class="mt-0.5 text-sm text-muted-foreground">Active Deliveries</p>
      </Card>
    </a>

    <a href="/app/inspections">
      <Card variant="interactive" padding="lg">
        <div class="flex items-start justify-between">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <ClipboardCheck class="h-5 w-5" />
          </div>
          {#if inspectionCounts?.loading}
            <Skeleton class="h-5 w-16" />
          {:else if inspectionCounts?.data?.overdue}
            <Badge variant="danger">{inspectionCounts.data.overdue} overdue</Badge>
          {/if}
        </div>
        {#if inspectionCounts?.loading}
          <Skeleton class="mt-4 h-8 w-12" />
        {:else if inspectionCounts?.data}
          <p class="mt-4 text-2xl font-bold">{inspectionCounts.data.pending}</p>
        {:else}
          <p class="mt-4 text-2xl font-bold">&mdash;</p>
        {/if}
        <p class="mt-0.5 text-sm text-muted-foreground">Pending Inspections</p>
      </Card>
    </a>

    <div>
      <Card variant="interactive" padding="lg">
        <div class="flex items-start justify-between">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <FileText class="h-5 w-5" />
          </div>
          <Badge variant="outline">Review</Badge>
        </div>
        <p class="mt-4 text-2xl font-bold">&mdash;</p>
        <p class="mt-0.5 text-sm text-muted-foreground">Blueprints to Review</p>
      </Card>
    </div>

    <a href="/app/safety">
      <Card variant="interactive" padding="lg">
        <div class="flex items-start justify-between">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <ShieldAlert class="h-5 w-5" />
          </div>
          {#if permitStats?.loading}
            <Skeleton class="h-5 w-16" />
          {:else if permitStats?.data?.expiringSoon}
            <Badge variant="warning">{permitStats.data.expiringSoon} expiring</Badge>
          {/if}
        </div>
        {#if permitStats?.loading}
          <Skeleton class="mt-4 h-8 w-12" />
        {:else if permitStats?.data}
          <p class="mt-4 text-2xl font-bold">{permitStats.data.active}</p>
        {:else}
          <p class="mt-4 text-2xl font-bold">&mdash;</p>
        {/if}
        <p class="mt-0.5 text-sm text-muted-foreground">Active Permits</p>
      </Card>
    </a>

    <a href="/app/my-tasks">
      <Card variant="interactive" padding="lg">
        <div class="flex items-start justify-between">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Kanban class="h-5 w-5" />
          </div>
          {#if myTasks?.loading}
            <Skeleton class="h-5 w-16" />
          {:else if Array.isArray(myTasks?.data)}
            <Badge variant="outline">{myTasks.data.length} assigned</Badge>
          {/if}
        </div>
        {#if myTasks?.loading}
          <Skeleton class="mt-4 h-8 w-12" />
        {:else if Array.isArray(myTasks?.data)}
          <p class="mt-4 text-2xl font-bold">{myTasks.data.length}</p>
        {:else}
          <p class="mt-4 text-2xl font-bold">&mdash;</p>
        {/if}
        <p class="mt-0.5 text-sm text-muted-foreground">Open Tasks</p>
      </Card>
    </a>
  </div>
</div>
