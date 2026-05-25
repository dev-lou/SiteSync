<script lang="ts">
  import { cn } from '$utils/cn';
  import { X } from '@lucide/svelte';

  let {
    open = false,
    title = '',
    size = 'md' as 'sm' | 'md' | 'lg' | 'xl' | 'full',
    closeOnOverlay = true,
    onclose,
    children,
    ...rest
  }: {
    open?: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlay?: boolean;
    onclose?: () => void;
    children?: import('svelte').Snippet;
  } & Record<string, unknown> = $props();

  function handleOverlayClick(e: MouseEvent) {
    if (closeOnOverlay && e.target === e.currentTarget) onclose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onclick={handleOverlayClick}
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div
      class={cn(
        'relative max-h-[85vh] overflow-y-auto rounded-lg bg-background shadow-xl',
        'animate-[fadeIn_0.15s_ease-out,slideUp_0.2s_ease-out]',
        {
          'w-full max-w-sm': size === 'sm',
          'w-full max-w-md': size === 'md',
          'w-full max-w-lg': size === 'lg',
          'w-full max-w-2xl': size === 'xl',
          'w-full max-w-5xl': size === 'full',
        },
      )}
      {...rest}
    >
      <div class="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 class="text-lg font-semibold">{title}</h2>
        <button
          onclick={() => onclose?.()}
          class="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close modal"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <div class="p-5">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(16px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
