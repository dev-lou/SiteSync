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
    Kanban,
    BarChart3,
    Users,
    Settings,
  } from '@lucide/svelte';

  interface NavItem {
    label: string;
    icon: typeof LayoutDashboard;
    href: string;
    roles: UserRole[];
  }

  const navItems: NavItem[] = [
    {
      label: 'Home',
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
      label: 'Tasks',
      icon: Kanban,
      href: '/app/my-tasks',
      roles: ['admin', 'project_manager', 'field_engineer', 'architect'],
    },
    {
      label: 'More',
      icon: BarChart3,
      href: '/app/reports',
      roles: [
        'admin',
        'project_manager',
        'field_engineer',
        'hse_officer',
        'architect',
        'procurement',
      ],
    },
  ];

  let {
    role = 'field_engineer' as UserRole,
  }: {
    role?: UserRole;
  } = $props();

  const filtered = $derived(navItems.filter((item) => item.roles.includes(role)));
</script>

<nav
  class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden safe-area-bottom"
>
  <div class="flex items-center justify-around px-2 py-1">
    {#each filtered as item}
      {@const isActive =
        $page.url.pathname.startsWith(item.href) ||
        (item.href === '/app' && $page.url.pathname === '/app')}
      <a
        href={item.href}
        class={cn(
          'flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <item.icon class="h-5 w-5" />
        <span>{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
