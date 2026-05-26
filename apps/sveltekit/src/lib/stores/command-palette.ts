import { writable, derived } from 'svelte/store';

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  keywords: string[];
  icon?: string;
  /** Navigate to this URL or call this action */
  action: string | (() => void);
  /** If URL, open in new tab? */
  external?: boolean;
  /** Group for visual separation */
  group?: string;
}

function createCommandPaletteStore() {
  const isOpen = writable(false);
  const query = writable('');
  const commands = writable<Command[]>([]);

  const filtered = derived([commands, query], ([$commands, $query]) => {
    if (!$query.trim()) return $commands;
    const q = $query.toLowerCase();
    return $commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.toLowerCase().includes(q)) ||
        cmd.description?.toLowerCase().includes(q),
    );
  });

  /** Register a set of commands */
  function register(cmds: Command[]) {
    commands.update((existing) => {
      const ids = new Set(existing.map((c) => c.id));
      const newCmds = cmds.filter((c) => !ids.has(c.id));
      return [...existing, ...newCmds];
    });
  }

  /** Toggle palette open/closed */
  function toggle() {
    isOpen.update((o) => !o);
    if (!isOpen) query.set('');
  }

  function open() {
    isOpen.set(true);
  }

  function close() {
    isOpen.set(false);
    query.set('');
  }

  return {
    isOpen,
    query,
    commands,
    filtered,
    register,
    toggle,
    open,
    close,
  };
}

export const commandPalette = createCommandPaletteStore();

/** Register built-in app commands (call once on app mount) */
export function registerBuiltinCommands() {
  commandPalette.register([
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      description: 'View project dashboard with summary stats',
      keywords: ['home', 'main', 'overview'],
      icon: '📊',
      action: '/app',
      group: 'Navigation',
    },
    {
      id: 'go-deliveries',
      label: 'Go to Deliveries',
      description: 'Monitor and manage material deliveries',
      keywords: ['delivery', 'tracking', 'truck', 'materials'],
      icon: '📦',
      action: '/app/deliveries',
      group: 'Navigation',
    },
    {
      id: 'go-inspections',
      label: 'Go to Inspections',
      description: 'Digital checklists with real-time updates',
      keywords: ['inspection', 'checklist', 'audit', 'quality'],
      icon: '🔍',
      action: '/app/inspections',
      group: 'Navigation',
    },
    {
      id: 'go-blueprints',
      label: 'Go to Blueprints',
      description: 'Version-controlled drawings with approval workflow',
      keywords: ['blueprint', 'drawing', 'revision', 'change order'],
      icon: '📐',
      action: '/app/blueprints',
      group: 'Navigation',
    },
    {
      id: 'go-safety',
      label: 'Go to Safety & Permits',
      description: 'Zone management, permits, and compliance heatmap',
      keywords: ['safety', 'permit', 'zone', 'heatmap', 'hse'],
      icon: '🛡️',
      action: '/app/safety',
      group: 'Navigation',
    },
    {
      id: 'go-tasks',
      label: 'Go to My Tasks',
      description: 'Tasks assigned to you with Kanban board',
      keywords: ['task', 'kanban', 'todo', 'assigned'],
      icon: '✅',
      action: '/app/my-tasks',
      group: 'Navigation',
    },
    {
      id: 'go-reports',
      label: 'Go to Reports',
      description: 'Analytics dashboard with charts and export',
      keywords: ['report', 'analytics', 'chart', 'graph', 'pdf'],
      icon: '📈',
      action: '/app/reports',
      group: 'Navigation',
    },
    {
      id: 'go-users',
      label: 'Go to User Management',
      description: 'Manage users, roles, and permissions',
      keywords: ['user', 'admin', 'role', 'permission', 'team'],
      icon: '👥',
      action: '/app/users',
      group: 'Admin',
    },
    {
      id: 'go-settings',
      label: 'Go to Settings',
      description: 'Project and account settings',
      keywords: ['settings', 'config', 'preference', 'profile'],
      icon: '⚙️',
      action: '/app/settings',
      group: 'Admin',
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark theme',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
      icon: '🌓',
      action: () => {
        import('./theme').then((m) => m.theme.toggle());
      },
      group: 'Actions',
    },
    {
      id: 'new-delivery',
      label: 'Create New Delivery',
      description: 'Open delivery creation form',
      keywords: ['new delivery', 'create delivery', 'add delivery'],
      icon: '➕',
      action: '/app/deliveries?new=true',
      group: 'Actions',
    },
    {
      id: 'new-inspection',
      label: 'Create New Inspection',
      description: 'Open inspection creation form',
      keywords: ['new inspection', 'create inspection', 'add inspection'],
      icon: '➕',
      action: '/app/inspections?new=true',
      group: 'Actions',
    },
    {
      id: 'new-blueprint',
      label: 'Upload New Blueprint',
      description: 'Upload a new blueprint drawing',
      keywords: ['new blueprint', 'upload blueprint', 'add drawing'],
      icon: '➕',
      action: '/app/blueprints?new=true',
      group: 'Actions',
    },
    {
      id: 'new-task',
      label: 'Create New Task',
      description: 'Create a new task on the Kanban board',
      keywords: ['new task', 'create task', 'add card'],
      icon: '➕',
      action: '/app/my-tasks?new=true',
      group: 'Actions',
    },
  ]);
}
