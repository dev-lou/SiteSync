<script lang="ts">
  import { page } from '$app/stores';
  import { cn } from '$utils/cn';
  import type { UserRole } from '$design/tokens';
  import {
    LayoutDashboard,
    Package,
    ClipboardCheck,
    FileText,
    ShieldAlert,
    KanbanSquare,
    ChevronLeft,
    Users,
    Settings,
    LogOut,
  } from '@lucide/svelte';

  interface NavItem {
    label: string;
    icon: typeof Package;
    href: string;
    roles: UserRole[];
  }

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/app',
      roles: [
        'admin',
        'project_manager',
        'field_engineer',
        'hse_officer',
        'architect',
        'procurement',
      ],
    },
    {
      label: 'Deliveries',
      icon: Package,
      href: '/app/deliveries',
      roles: ['admin', 'procurement', 'field_engineer', 'project_manager'],
    },
    {
      label: 'Inspections',
      icon: ClipboardCheck,
      href: '/app/inspections',
      roles: ['admin', 'architect', 'field_engineer', 'project_manager'],
    },
    {
      label: 'Blueprints',
      icon: FileText,
      href: '/app/blueprints',
      roles: ['admin', 'architect', 'field_engineer', 'project_manager'],
    },
    {
      label: 'Safety',
      icon: ShieldAlert,
      href: '/app/safety',
      roles: ['admin', 'hse_officer', 'field_engineer', 'project_manager'],
    },
    {
      label: 'Kanban',
      icon: KanbanSquare,
      href: '/app/projects',
      roles: ['admin', 'project_manager', 'field_engineer', 'architect'],
    },
    { label: 'Users', icon: Users, href: '/app/users', roles: ['admin'] },
    {
      label: 'Settings',
      icon: Settings,
      href: '/app/settings',
      roles: ['admin', 'project_manager'],
    },
  ];

  let collapsed = $state(false);

  let {
    role = 'field_engineer' as UserRole,
  }: {
    role?: UserRole;
  } = $props();

  const filtered = $derived(navItems.filter((item) => item.roles.includes(role)));
</script>

<aside
  class={cn(
    'flex h-dvh flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200',
    collapsed ? 'w-16' : 'w-60',
  )}
>
  <div class="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold"
    >
      SP
    </div>
    {#if !collapsed}
      <span class="text-sm font-semibold tracking-tight">SiteSync</span>
    {/if}
    <button
      onclick={() => (collapsed = !collapsed)}
      class={cn(
        'focus-ring ml-auto flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-border hover:text-sidebar-foreground transition-transform',
        collapsed && 'rotate-180',
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <ChevronLeft class="h-4 w-4" />
    </button>
  </div>
  <nav class="flex-1 space-y-1 overflow-y-auto p-2">
    {#each filtered as item}
      <a
        href={item.href}
        class={cn(
          'focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          $page.url.pathname.startsWith(item.href)
            ? 'bg-sidebar-border text-sidebar-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-border/50 hover:text-sidebar-foreground',
        )}
      >
        <item.icon class="h-4 w-4 shrink-0" />
        {#if !collapsed}
          <span>{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>
  <div class="border-t border-sidebar-border p-2">
    <button
      class="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-border/50 hover:text-sidebar-foreground"
    >
      <LogOut class="h-4 w-4 shrink-0" />
      {#if !collapsed}
        <span>Sign Out</span>
      {/if}
    </button>
  </div>
</aside>
