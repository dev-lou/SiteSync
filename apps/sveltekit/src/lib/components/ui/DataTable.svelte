<script lang="ts">
  import { cn } from '$utils/cn';
  import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from '@lucide/svelte';
  import Skeleton from './Skeleton.svelte';

  interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (row: Record<string, unknown>) => string;
  }

  let {
    columns = [] as Column[],
    data = [] as Record<string, unknown>[],
    loading = false,
    searchable = false,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No results found.',
    class: className = '',
    onrowclick,
    ...rest
  }: {
    columns?: Column[];
    data?: Record<string, unknown>[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyMessage?: string;
    class?: string;
    onrowclick?: (row: Record<string, unknown>) => void;
  } & Record<string, unknown> = $props();

  let sortKey = $state('');
  let sortDir = $state<'asc' | 'desc'>('asc');
  let searchQuery = $state('');

  const filtered = $derived(
    searchQuery
      ? data.filter((row) =>
          Object.values(row).some((v) =>
            String(v).toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        )
      : data,
  );

  const sorted = $derived(
    [...filtered].sort((a, b) => {
      if (!sortKey) return 0;
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    }),
  );

  function toggleSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
  }

  function getCellValue(row: Record<string, unknown>, col: Column): string {
    if (col.render) return col.render(row);
    return String(row[col.key] ?? '');
  }
</script>

<div class={cn('space-y-3', className)} {...rest}>
  {#if searchable}
    <div class="relative">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        placeholder={searchPlaceholder}
        bind:value={searchQuery}
        class="focus-ring h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
  {/if}

  <div class="overflow-x-auto rounded-md border border-border">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border bg-muted/50">
          {#each columns as col}
            <th
              scope="col"
              class={cn(
                'h-10 px-4 text-left font-medium text-muted-foreground',
                col.sortable && 'cursor-pointer select-none hover:text-foreground',
              )}
              style={col.width ? `width: ${col.width}` : undefined}
              onclick={() => col.sortable && toggleSort(col.key)}
            >
              <div class="flex items-center gap-1.5">
                <span>{col.label}</span>
                {#if col.sortable}
                  {#if sortKey === col.key}
                    {#if sortDir === 'asc'}
                      <ChevronUp class="h-3.5 w-3.5" />
                    {:else}
                      <ChevronDown class="h-3.5 w-3.5" />
                    {/if}
                  {:else}
                    <ChevronsUpDown class="h-3.5 w-3.5 opacity-40" />
                  {/if}
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if loading}
          {#each { length: 5 } as _}
            <tr class="border-b border-border last:border-b-0">
              {#each columns as col}
                <td class="px-4 py-2.5">
                  <Skeleton variant="text" />
                </td>
              {/each}
            </tr>
          {/each}
        {:else if sorted.length === 0}
          <tr>
            <td
              colspan={columns.length}
              class="px-4 py-8 text-center text-sm text-muted-foreground"
            >
              {emptyMessage}
            </td>
          </tr>
        {:else}
          {#each sorted as row}
            <tr
              class={cn(
                'border-b border-border last:border-b-0 transition-colors',
                onrowclick && 'cursor-pointer hover:bg-muted/50',
              )}
              onclick={() => onrowclick?.(row)}
            >
              {#each columns as col}
                <td class="px-4 py-2.5">{getCellValue(row, col)}</td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
