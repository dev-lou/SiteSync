<script lang="ts">
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  import Sidebar from '$layout/Sidebar.svelte';
  import BottomNav from '$layout/BottomNav.svelte';
  import Header from '$layout/Header.svelte';
  import ToastContainer from '$ui/ToastContainer.svelte';
  import CommandPalette from '$ui/CommandPalette.svelte';
  import { commandPalette, registerBuiltinCommands } from '$stores/command-palette';
  import { onMount } from 'svelte';
  import type { UserRole } from '$design/tokens';

  let {
    children,
    data,
  }: {
    children?: import('svelte').Snippet;
    data: {
      user: { id: string; name: string; email: string; role: UserRole; avatarUrl?: string; projectId: string };
    };
  } = $props();

  onMount(() => {
    registerBuiltinCommands();
  });
</script>

<div class="flex min-h-dvh">
  <!-- Desktop Sidebar (hidden on mobile) -->
  <div class="hidden md:block">
    <Sidebar role={data.user.role} />
  </div>

  <!-- Main Content Area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <Header user={data.user} />

    <!-- Page content with enter animation -->
    <main class="flex-1 overflow-y-auto pb-20 md:pb-6">
      {#key $page.url.pathname}
        <div
          in:fly={{ y: 8, duration: 200, opacity: 0 }}
          class="p-4 sm:p-6"
        >
          {#if children}
            {@render children()}
          {/if}
        </div>
      {/key}
    </main>
  </div>
</div>

<!-- Mobile Bottom Navigation -->
<BottomNav role={data.user.role} />

<!-- Command Palette (Cmd+K) overlay -->
<CommandPalette />

<!-- Toast container -->
<ToastContainer />
