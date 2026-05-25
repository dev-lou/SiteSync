<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { cn } from '$utils/cn';
  import { theme } from '$stores/theme';
  import { notifications } from '$stores/notifications';
  import { commandPalette } from '$stores/command-palette';
  import { Sun, Moon, Command } from '@lucide/svelte';
  import Avatar from '$ui/Avatar.svelte';
  import Tooltip from '$ui/Tooltip.svelte';
  import NotificationDropdown from '$ui/NotificationDropdown.svelte';

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  }

  let {
    user = undefined as User | undefined,
    class: className = '',
    ...rest
  }: {
    user?: User;
    class?: string;
  } & Record<string, unknown> = $props();

  onMount(() => {
    if (user?.id) {
      notifications.subscribeToUpdates(user.id);
    }
  });

  onDestroy(() => {
    notifications.disconnect();
  });

  function handleMarkRead(id: string) {
    notifications.markRead(id);
  }

  function handleMarkAllRead() {
    notifications.markAllRead();
  }

  const pageTitle = $derived.by(() => {
    const segments = $page.url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || 'Dashboard';
    return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  });
</script>
<header
  class={cn('flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6', className)}
  {...rest}
>
  <div class="flex items-center gap-3">
    <button
      onclick={() => commandPalette.toggle()}
      class="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <Command class="h-4 w-4" />
    </button>
    <h2 class="text-sm font-medium text-muted-foreground hidden sm:block">
      {pageTitle}
    </h2>
  </div>

  <div class="flex items-center gap-1 sm:gap-3">
    <Tooltip content="Cmd+K to search">
      <button
        onclick={() => commandPalette.toggle()}
        class="focus-ring hidden md:flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Command palette"
      >
        <Command class="h-3 w-3" />
        <span>Search...</span>
        <kbd class="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">&#8984;K</kbd>
      </button>
    </Tooltip>

    <Tooltip content={$theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
      <button
        onclick={() => theme.toggle()}
        class="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        {#if $theme === 'dark'}
          <Sun class="h-4 w-4" />
        {:else}
          <Moon class="h-4 w-4" />
        {/if}
      </button>
    </Tooltip>

    <NotificationDropdown
      notifications={$notifications.items}
      unreadCount={$notifications.unreadCount}
      loading={$notifications.loading}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
    />

    {#if user}
      <div class="hidden sm:flex items-center gap-2.5 pl-2">
        <div class="text-right text-sm leading-tight">
          <p class="font-medium text-foreground">{user.name}</p>
          <p class="text-xs text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
        </div>
        <a href="/app/settings" class="focus-ring">
          <Avatar src={user.avatarUrl} fallback={user.name?.slice(0, 2)} size="sm" />
        </a>
      </div>
    {/if}
  </div>
</header>

