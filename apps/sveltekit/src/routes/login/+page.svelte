<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Button from '$ui/Button.svelte';
  import Card from '$ui/Card.svelte';
  import Input from '$ui/Input.svelte';
  import { theme } from '$stores/theme';
  import { Sun, Moon, LogIn } from '@lucide/svelte';

  let email = $state('');
  let password = $state('');
  let name = $state('');
  let loading = $state(false);
  let error = $state('');
  let isSignUp = $state(false);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  const isDark = $derived(mounted && $theme === 'dark');

  async function handleSignIn(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const endpoint = isSignUp ? '/api/auth/sign-up/email' : '/api/auth/sign-in/email';
      const body = isSignUp ? { email, password, name } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = data.error || data.message || `Failed (${res.status})`;
        return;
      }

      await goto('/app');
    } catch {
      error = 'Network error — is the server running?';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-muted/30 p-6">
  <div class="absolute right-4 top-4">
    <button
      onclick={() => theme.toggle()}
      class="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun class="h-4 w-4" style="display: {isDark ? 'block' : 'none'}" />
      <Moon class="h-4 w-4" style="display: {isDark ? 'none' : 'block'}" />
    </button>
  </div>

  <Card padding="xl" class="w-full max-w-sm">
    <div class="mb-6 text-center">
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold"
      >
        SP
      </div>
      <h1 class="mt-4 text-xl font-bold tracking-tight">SiteSync Pro</h1>
      <p class="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
    </div>

    <form onsubmit={handleSignIn} class="space-y-4">
      <Input label="Email" type="email" placeholder="admin@test.com" bind:value={email} required />
      {#if isSignUp}
        <Input label="Name" type="text" placeholder="Your name" bind:value={name} required />
      {/if}
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        bind:value={password}
        required
      />
      {#if error}
        <p class="text-sm text-destructive">{error}</p>
      {/if}
      <Button class="w-full" {loading}>
        <LogIn class="h-4 w-4" />
        <span>{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}</span>
      </Button>
    </form>
    <p class="mt-4 text-center text-xs text-muted-foreground">
      {#if isSignUp}
        Already have an account?
        <button
          type="button"
          onclick={() => (isSignUp = false)}
          class="font-medium text-primary hover:underline">Sign in</button
        >
      {:else}
        No account?
        <button
          type="button"
          onclick={() => (isSignUp = true)}
          class="font-medium text-primary hover:underline">Create one</button
        >
      {/if}
    </p>
  </Card>
</div>
