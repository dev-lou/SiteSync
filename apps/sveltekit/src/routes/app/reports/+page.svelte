<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import Badge from '$ui/Badge.svelte';
  import Skeleton from '$ui/Skeleton.svelte';
  import Select from '$ui/Select.svelte';
  import { useConvexQuery } from '$stores/convex-query';
  import {
    BarChart3, TrendingUp, Download, FileText, RefreshCw, Calendar,
  } from '@lucide/svelte';

  const projectId = $derived($page.data.user?.projectId || '');

  const deliveryCounts = $derived(
    projectId ? useConvexQuery('deliveries:getDeliveryCounts', { projectId }) : null
  );
  const inspectionCounts = $derived(
    projectId ? useConvexQuery('inspections:getCounts', { projectId }) : null
  );
  const permitStats = $derived(
    projectId ? useConvexQuery('permits:getPermitStats', { projectId }) : null
  );

  const deliveries = $derived(
    projectId ? useConvexQuery('deliveries:listByProject', { projectId }) : null
  );
  const inspections = $derived(
    projectId ? useConvexQuery('inspections:listByProject', { projectId }) : null
  );
  const permits = $derived(
    projectId ? useConvexQuery('permits:listByProject', { projectId }) : null
  );

  let chartCanvas = $state<HTMLCanvasElement | null>(null);
  let chartInstance: unknown = null;

  let selectedPeriod = $state('7d');

  const periodOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last Quarter' },
  ];

  // Compute per-status breakdowns
  const deliveryStatuses = $derived.by(() => {
    const items = (deliveries?.data as Array<Record<string, unknown>>) || [];
    const counts: Record<string, number> = {};
    for (const d of items) {
      const s = (d.status as string) || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  });

  const inspectionStatuses = $derived.by(() => {
    const items = (inspections?.data as Array<Record<string, unknown>>) || [];
    const counts: Record<string, number> = {};
    for (const d of items) {
      const s = (d.status as string) || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  });

  const permitByType = $derived.by(() => {
    const items = (permits?.data as Array<Record<string, unknown>>) || [];
    const counts: Record<string, number> = {};
    for (const d of items) {
      const t = (d.type as string) || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  });

  function statusColor(status: string): string {
    const map: Record<string, string> = {
      ordered: '#3b82f6',
      dispatched: '#8b5cf6',
      in_transit: '#f59e0b',
      on_site: '#14b8a6',
      received_inspected: '#22c55e',
      pending: '#6b7280',
      in_progress: '#f59e0b',
      passed: '#22c55e',
      failed: '#ef4444',
      remedial: '#f97316',
      active: '#22c55e',
      applied: '#3b82f6',
      expired: '#ef4444',
      suspended: '#f59e0b',
    };
    return map[status] || '#6b7280';
  }

  function statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  onMount(() => {
    if (!chartCanvas) return;

    import('chart.js').then(({ Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend }) => {
      Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

      chartInstance = new Chart(chartCanvas!, {
        type: 'bar',
        data: {
          labels: ['Deliveries', 'Inspections', 'Permits'],
          datasets: [
            {
              label: 'Active',
              data: [
                (deliveryCounts?.data as Record<string, unknown>)?.active || 0,
                (inspectionCounts?.data as Record<string, unknown>)?.pending || 0,
                (permitStats?.data as Record<string, unknown>)?.active || 0,
              ],
              backgroundColor: '#22c55e',
            },
            {
              label: 'Expiring / Overdue',
              data: [
                (deliveryCounts?.data as Record<string, unknown>)?.expiringSoon || 0,
                (inspectionCounts?.data as Record<string, unknown>)?.overdue || 0,
                (permitStats?.data as Record<string, unknown>)?.expiringSoon || 0,
              ],
              backgroundColor: '#f59e0b',
            },
            {
              label: 'Completed',
              data: [
                (deliveryCounts?.data as Record<string, unknown>)?.received || 0,
                (inspectionCounts?.data as Record<string, unknown>)?.passed || 0,
                Object.keys(permitStats?.data || {}).length > 0 ? 0 : 0,
              ],
              backgroundColor: '#3b82f6',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Project Overview', font: { size: 16 } },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'oklch(0.9 0.01 260)' } },
            x: { grid: { display: false } },
          },
        },
      });
    });

    return () => {
      if (chartInstance && typeof (chartInstance as Record<string, unknown>).destroy === 'function') {
        (chartInstance as { destroy: () => void }).destroy();
      }
    };
  });

  const loading = $derived(deliveries?.loading ?? true);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
      <p class="mt-1 text-sm text-muted-foreground">Project-wide metrics, trends, and exportable data</p>
    </div>
    <div class="flex items-center gap-3">
      <Select
        options={periodOptions}
        value={selectedPeriod}
        onchange={(val: string) => selectedPeriod = val}
      />
      <Button variant="outline">
        <Download class="h-4 w-4" />
        <span class="hidden sm:inline">Export PDF</span>
      </Button>
    </div>
  </div>

  <!-- KPI Summary Cards -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card padding="md">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Deliveries</p>
      {#if deliveryCounts?.loading}
        <Skeleton class="mt-2 h-7 w-12" />
      {:else}
        <p class="mt-1 text-2xl font-bold">{(deliveryCounts?.data as Record<string, unknown>)?.active || 0}</p>
      {/if}
      <p class="mt-1 text-xs text-muted-foreground">{(deliveryCounts?.data as Record<string, unknown>)?.received || 0} received</p>
    </Card>

    <Card padding="md">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Inspections</p>
      {#if inspectionCounts?.loading}
        <Skeleton class="mt-2 h-7 w-12" />
      {:else}
        <p class="mt-1 text-2xl font-bold">{(inspectionCounts?.data as Record<string, unknown>)?.pending || 0}</p>
      {/if}
      <p class="mt-1 text-xs text-muted-foreground">{(inspectionCounts?.data as Record<string, unknown>)?.passed || 0} passed</p>
    </Card>

    <Card padding="md">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Permits</p>
      {#if permitStats?.loading}
        <Skeleton class="mt-2 h-7 w-12" />
      {:else}
        <p class="mt-1 text-2xl font-bold">{(permitStats?.data as Record<string, unknown>)?.active || 0}</p>
      {/if}
      <p class="mt-1 text-xs text-muted-foreground">{(permitStats?.data as Record<string, unknown>)?.expiringSoon || 0} expiring</p>
    </Card>

    <Card padding="md">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Items</p>        <p class="mt-1 text-2xl font-bold">
          {((deliveries?.data as Array<unknown>)?.length || 0) + ((inspections?.data as Array<unknown>)?.length || 0) + ((permits?.data as Array<unknown>)?.length || 0)}
        </p>
      <p class="mt-1 text-xs text-muted-foreground">Across all modules</p>
    </Card>
  </div>

  <!-- Chart + Status Breakdowns -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card padding="lg">
      <div class="flex items-center gap-3 mb-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3 class="h-5 w-5" />
        </div>
        <div>
          <p class="font-medium">Overview Chart</p>
          <p class="text-xs text-muted-foreground">Aggregated counts across all modules</p>
        </div>
      </div>
      <div class="h-64">
        {#if loading}
          <div class="flex h-full items-center justify-center">
            <Skeleton class="h-48 w-full" />
          </div>
        {:else}
          <canvas bind:this={chartCanvas} />
        {/if}
      </div>
    </Card>

    <div class="space-y-4">
      <Card padding="md">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deliveries by Status</h3>
        {#if deliveryStatuses.length === 0}
          <p class="text-sm text-muted-foreground">No data</p>
        {:else}
          <div class="space-y-2">
            {#each deliveryStatuses as item}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" style="background: {statusColor(item.status)}" />
                  <span class="text-sm">{statusLabel(item.status)}</span>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            {/each}
          </div>
        {/if}
      </Card>

      <Card padding="md">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspections by Status</h3>
        {#if inspectionStatuses.length === 0}
          <p class="text-sm text-muted-foreground">No data</p>
        {:else}
          <div class="space-y-2">
            {#each inspectionStatuses as item}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" style="background: {statusColor(item.status)}" />
                  <span class="text-sm">{statusLabel(item.status)}</span>
                </div>
                <Badge variant="outline">{item.count}</Badge>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    </div>
  </div>

  <!-- Permit Type Breakdown + Export -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card padding="md">
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permits by Type</h3>
      {#if permitByType.length === 0}
        <p class="text-sm text-muted-foreground">No permits yet</p>
      {:else}
        <div class="space-y-2">
          {#each permitByType as item}
            <div class="flex items-center justify-between">
              <span class="text-sm">{statusLabel(item.type)}</span>
              <Badge variant="outline">{item.count}</Badge>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <Card padding="md">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText class="h-5 w-5" />
        </div>
        <div>
          <p class="font-medium">Export & Reports</p>
          <p class="text-xs text-muted-foreground">Generate PDF or CSV exports</p>
        </div>
      </div>
      <div class="mt-4 space-y-2">
        <Button variant="outline" class="w-full justify-start">
          <Calendar class="h-4 w-4" />
          <span>Daily Summary Report</span>
        </Button>
        <Button variant="outline" class="w-full justify-start">
          <BarChart3 class="h-4 w-4" />
          <span>Inspection Compliance Report</span>
        </Button>
        <Button variant="outline" class="w-full justify-start">
          <TrendingUp class="h-4 w-4" />
          <span>Delivery Performance Analysis</span>
        </Button>
      </div>
    </Card>
  </div>
</div>
