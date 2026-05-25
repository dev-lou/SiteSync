<script lang="ts">
  import { onMount } from 'svelte';
  import { commandPalette } from '$stores/command-palette';
  import { cn } from '$utils/cn';
  import { Search, ExternalLink, Command } from '@lucide/svelte';

  let searchInput = $state<HTMLInputElement | null>(null);
  let selectedIndex = $state(0);
  let isOpen = $state(false);
  let searchQuery = $state('');

  const commands = $derived($commandPalette.commands);
  const filtered = $derived($commandPalette.filtered);

  // Subscribe to store state
  const unsubscribeOpen = commandPalette.isOpen.subscribe((v) => {
    isOpen = v;
    if (v) {
      setTimeout(() => searchInput?.focus(), 50);
    } else {
      searchQuery = '';
      selectedIndex = 0;
    }
  });

  const unsubscribeQuery = commandPalette.query.subscribe((v) => {
    searchQuery = v;
  });

  onMount(() => {
    // Global keyboard shortcut (registerBuiltinCommands is called from +layout.svelte)
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        commandPalette.toggle();
      }
      if (e.key === 'Escape' && $commandPalette.isOpen) {
        commandPalette.close();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      unsubscribeOpen();
      unsubscribeQuery();
    };
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    commandPalette.query.set(target.value);
    selectedIndex = 0;
  }

  function executeCommand(index: number) {
    const cmd = filtered[index];
    if (!cmd) return;

    if (typeof cmd.action === 'string') {
      const url = cmd.action;
      if (cmd.external) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    } else if (typeof cmd.action === 'function') {
      cmd.action();
    }
    commandPalette.close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(selectedIndex);
    }
  }

  // Group commands by their group field
  const grouped = $derived.by(() => {
    const groups = new Map<string, typeof filtered>();
    for (const cmd of filtered) {
      const g = cmd.group || 'General';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(cmd);
    }
    return Array.from(groups.entries());
  });
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
    onclick={() => commandPalette.close()}
  />

  <!-- Palette -->
  <div
    class="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-border bg-background shadow-xl"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-label="Command palette"
  >
    <!-- Search -->
    <div class="flex items-center border-b border-border px-4">
      <Search class="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        bind:this={searchInput}
        type="text"
        value={searchQuery}
        oninput={handleInput}
        onkeydown={handleKeydown}
        placeholder="Search commands, pages, and actions..."
        class="flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-muted-foreground/50"
        autocomplete="off"
        spellcheck="false"
      />
      <kbd class="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
        ESC
      </kbd>
    </div>

    <!-- Results -->
    <div class="max-h-80 overflow-y-auto p-2">
      {#if filtered.length === 0}
        <div class="flex flex-col items-center py-8 text-center">
          <p class="text-sm text-muted-foreground">No results found</p>
          <p class="text-xs text-muted-foreground/60">Try a different search term</p>
        </div>
      {:else}
        {#each grouped as [group, groupItems]}
          <div>
            <p class="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group}
            </p>
            {#each groupItems as cmd, i}
              {@const globalIndex = filtered.indexOf(cmd)}
              <button
                onclick={() => executeCommand(globalIndex)}
                onmouseenter={() => selectedIndex = globalIndex}
                class={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                  globalIndex === selectedIndex
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                {#if cmd.icon}
                  <span class="text-base leading-none">{cmd.icon}</span>
                {/if}
                <div class="flex-1 min-w-0">
                  <p class="font-medium truncate">{cmd.label}</p>
                  {#if cmd.description}
                    <p class="text-xs text-muted-foreground/70 truncate">{cmd.description}</p>
                  {/if}
                </div>
                {#if cmd.shortcut}
                  <kbd class="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {cmd.shortcut}
                  </kbd>
                {/if}
                {#if typeof cmd.action === 'string' && cmd.external}
                  <ExternalLink class="h-3 w-3 shrink-0 text-muted-foreground/50" />
                {/if}
              </button>
            {/each}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer hint -->
    <div class="border-t border-border px-4 py-2">
      <div class="flex items-center gap-4 text-[10px] text-muted-foreground/60">
        <span class="flex items-center gap-1">
          <kbd class="rounded border border-border px-1 py-0.5 text-[10px]">↑↓</kbd> Navigate
        </span>
        <span class="flex items-center gap-1">
          <kbd class="rounded border border-border px-1 py-0.5 text-[10px]">↵</kbd> Select
        </span>
        <span class="flex items-center gap-1">
          <kbd class="rounded border border-border px-1 py-0.5 text-[10px]">Esc</kbd> Close
        </span>
      </div>
    </div>
  </div>
{/if}
