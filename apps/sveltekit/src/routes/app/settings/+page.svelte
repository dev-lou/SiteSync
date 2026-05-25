<script lang="ts">
  import { page } from '$app/stores';
  import { theme } from '$stores/theme';
  import Card from '$ui/Card.svelte';
  import Button from '$ui/Button.svelte';
  import Input from '$ui/Input.svelte';
  import Badge from '$ui/Badge.svelte';
  import Avatar from '$ui/Avatar.svelte';
  import Toast from '$ui/Toast.svelte';
  import {
    User, Bell, Palette, Sun, Moon, Save,
  } from '@lucide/svelte';

  const user = $derived($page.data.user);

  let profileName = $state('');
  let profileEmail = $state('');
  let notifyDeliveries = $state(true);
  let notifyInspections = $state(true);
  let notifyPermits = $state(true);
  let notifyTasks = $state(true);
  let toastMessage = $state('');
  let toastType = $state<'success' | 'error'>('success');
  let initialized = $state(false);

  // Initialize from user data once
  if (user && !initialized) {
    profileName = user.name || '';
    profileEmail = user.email || '';
    initialized = true;
  }

  const notificationItems = [
    { label: 'Delivery updates', desc: 'Material arrivals, delays, and ETA changes' },
    { label: 'Inspection results', desc: 'When inspections are completed or require attention' },
    { label: 'Permit changes', desc: 'Expiring permits and zone status changes' },
    { label: 'Task assignments', desc: 'When you are assigned or mentioned in a task' },
  ];

  function saveProfile() {
    toastMessage = 'Profile updated successfully';
    toastType = 'success';
  }

  function resetSettings() {
    notifyDeliveries = true;
    notifyInspections = true;
    notifyPermits = true;
    notifyTasks = true;
    toastMessage = 'Settings reset to defaults';
    toastType = 'success';
  }
</script>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
    <p class="mt-1 text-sm text-muted-foreground">Manage your account and application preferences</p>
  </div>

  <Card padding="lg">
    <div class="flex items-center gap-3 mb-4">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <User class="h-5 w-5" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">Profile</h2>
        <p class="text-xs text-muted-foreground">Your personal information</p>
      </div>
    </div>

    <div class="flex items-center gap-4 mb-6">
      <Avatar src={user?.avatarUrl} fallback={user?.name?.slice(0, 2) || 'U'} size="lg" />
      <div>
        <p class="font-medium">{user?.name}</p>
        <p class="text-sm text-muted-foreground">{user?.role?.replace(/_/g, ' ')}</p>
        <Badge variant="outline" class="mt-1">{user?.email}</Badge>
      </div>
    </div>

    <div class="space-y-4">
      <Input label="Display Name" bind:value={profileName} placeholder="Your name" />
      <Input label="Email" bind:value={profileEmail} placeholder="your@email.com" disabled />
      <Button onclick={saveProfile}>
        <Save class="h-4 w-4" />
        <span>Save Profile</span>
      </Button>
    </div>
  </Card>

  <Card padding="lg">
    <div class="flex items-center gap-3 mb-4">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Palette class="h-5 w-5" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">Appearance</h2>
        <p class="text-xs text-muted-foreground">Theme and display preferences</p>
      </div>
    </div>

    <div class="flex items-center justify-between rounded-md border border-border p-4">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {#if $theme === 'dark'}
            <Moon class="h-4 w-4" />
          {:else}
            <Sun class="h-4 w-4" />
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium">Theme</p>
          <p class="text-xs text-muted-foreground">Currently: {$theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
        </div>
      </div>
      <Button variant="outline" onclick={() => theme.toggle()}>
        {$theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      </Button>
    </div>
  </Card>

  <Card padding="lg">
    <div class="flex items-center gap-3 mb-4">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Bell class="h-5 w-5" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">Notifications</h2>
        <p class="text-xs text-muted-foreground">Which events you want to be notified about</p>
      </div>
    </div>

    <div class="space-y-3">
      {#each notificationItems as item, i}
        <label class="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer transition-colors">
          <div>
            <p class="text-sm font-medium">{item.label}</p>
            <p class="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          {#if i === 0}
            <input type="checkbox" bind:checked={notifyDeliveries} class="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
          {:else if i === 1}
            <input type="checkbox" bind:checked={notifyInspections} class="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
          {:else if i === 2}
            <input type="checkbox" bind:checked={notifyPermits} class="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
          {:else}
            <input type="checkbox" bind:checked={notifyTasks} class="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
          {/if}
        </label>
      {/each}
    </div>
  </Card>

  <div class="flex gap-3">
    <Button variant="outline" onclick={resetSettings}>
      Reset to Defaults
    </Button>
  </div>
</div>

{#if toastMessage}
  <div class="fixed bottom-4 right-4 z-50">
    <Toast type={toastType} message={toastMessage} />
  </div>
{/if}
