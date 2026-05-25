<script lang="ts">
  import { cn } from '$utils/cn';

  interface Tab {
    id: string;
    label: string;
    count?: number;
  }

  let {
    tabs = [] as Tab[],
    activeTab = '',
    onchange,
    class: className = '',
    ...rest
  }: {
    tabs?: Tab[];
    activeTab?: string;
    onchange?: (id: string) => void;
    class?: string;
  } & Record<string, unknown> = $props();
</script>

<div class={cn('flex border-b border-border', className)} role="tablist" {...rest}>
  {#each tabs as tab}
    <button
      role="tab"
      aria-selected={activeTab === tab.id}
      onclick={() => onchange?.(tab.id)}
      class={cn(
        'focus-ring relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
        activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {tab.label}
      {#if tab.count !== undefined}
        <span
          class={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {tab.count}
        </span>
      {/if}
      {#if activeTab === tab.id}
        <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></span>
      {/if}
    </button>
  {/each}
</div>
