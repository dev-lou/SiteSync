<script lang="ts">
  import { cn } from '$utils/cn';
  import {
    Bell,
    CheckCheck,
    Package,
    ClipboardCheck,
    ShieldAlert,
    FileText,
    Kanban,
    Info,
  } from '@lucide/svelte';
  import type { Notification, NotificationType } from '$stores/notifications';

  let {
    notifications = [] as Notification[],
    unreadCount = 0,
    loading = false,
    onMarkRead = (_id: string) => {},
    onMarkAllRead = () => {},
    onDismiss = (_id: string) => {},
  }: {
    notifications?: Notification[];
    unreadCount?: number;
    loading?: boolean;
    onMarkRead?: (id: string) => void;
    onMarkAllRead?: () => void;
    onDismiss?: (id: string) => void;
  } = $props();

  let open = $state(false);

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  const typeIcons: Record<NotificationType, typeof Bell> = {
    delivery: Package,
    inspection: ClipboardCheck,
    permit: ShieldAlert,
    blueprint: FileText,
    task: Kanban,
    system: Info,
  };

  function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
</script>

<div class="relative" data-testid="notification-dropdown">
  <button
    onclick={toggle}
    class="focus-ring relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    aria-label="Notifications"
  >
    <Bell class="h-4 w-4" />
    {#if unreadCount > 0}
      <span
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none"
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    {/if}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 z-40"
      onclick={close}
      onkeydown={(e) => {
        if (e.key === 'Escape') close();
      }}
      role="presentation"
    ></div>

    <!-- Dropdown -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-background shadow-lg md:w-96"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 class="text-sm font-semibold">Notifications</h3>
        {#if unreadCount > 0}
          <button
            onclick={onMarkAllRead}
            class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <CheckCheck class="h-3 w-3" />
            Mark all read
          </button>
        {/if}
      </div>

      <div class="max-h-80 overflow-y-auto">
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <div
              class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
            ></div>
          </div>
        {:else if notifications.length === 0}
          <div class="flex flex-col items-center py-8 text-center">
            <Bell class="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p class="text-sm font-medium text-muted-foreground">No notifications yet</p>
            <p class="text-xs text-muted-foreground/60">Updates will appear here in real time</p>
          </div>
        {:else}
          {#each notifications as notif}
            {@const Icon = typeIcons[notif.type] || Info}
            <button
              onclick={() => onMarkRead(notif.id)}
              class={cn(
                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                !notif.read && 'bg-primary/[0.03]',
              )}
            >
              <div
                class={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  notif.severity === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : notif.severity === 'warning'
                      ? 'bg-warning/10 text-warning'
                      : notif.severity === 'success'
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary',
                )}
              >
                <Icon class="h-3.5 w-3.5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class={cn('text-sm truncate', !notif.read && 'font-medium')}>{notif.title}</p>
                <p class="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                <p class="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(notif.createdAt)}</p>
              </div>
              {#if !notif.read}
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
