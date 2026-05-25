<script lang="ts">
  import Button from '$ui/Button.svelte';
  import Card from '$ui/Card.svelte';
  import Input from '$ui/Input.svelte';
  import { theme } from '$stores/theme';
  import { Sun, Moon, Mail } from '@lucide/svelte';

  let email = $state('');
  let loading = $state(false);
</script>

<div class="flex min-h-dvh flex-col items-center justify-center bg-muted/30 p-6">
  <div class="absolute right-4 top-4">
    <button
      onclick={() => theme.toggle()}
      class="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
    >
      {#if $theme === 'dark'}
        <Sun class="h-4 w-4" />
      {:else}
        <Moon class="h-4 w-4" />
      {/if}
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

    <form
      onsubmit={(e) => {
        e.preventDefault();
        loading = true;
      }}
      class="space-y-4"
    >
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        bind:value={email}
        required
      />
      <Button class="w-full" {loading}>
        <Mail class="h-4 w-4" />
        <span>Send Magic Link</span>
      </Button>
      <p class="text-center text-xs text-muted-foreground">
        A one-time login link will be sent to your email
      </p>
    </form>
  </Card>
</div>
