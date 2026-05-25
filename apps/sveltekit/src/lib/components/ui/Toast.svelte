<script lang="ts">
  import { cn } from '$utils/cn';
  import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from '@lucide/svelte';
  import { toasts, removeToast, type Toast as ToastType } from '$stores/toast';

  function toastIcon(type: ToastType['type']) {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
    }
  }
</script>

{#if $toasts.length > 0}
  <div class="fixed right-4 top-4 z-[100] flex flex-col gap-2">
    {#each $toasts as toast (toast.id)}
      {@const IconComponent = toastIcon(toast.type)}
      <div
        class={cn(
          'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md backdrop-blur-sm',
          'animate-[slideIn_0.25s_ease-out]',
          {
            'border-success/20 bg-success/5 text-success': toast.type === 'success',
            'border-danger/20 bg-danger/5 text-danger': toast.type === 'error',
            'border-warning/20 bg-warning/5 text-warning': toast.type === 'warning',
            'border-primary/20 bg-primary/5 text-primary': toast.type === 'info',
          },
        )}
        role="alert"
      >
        <IconComponent class="mt-0.5 h-4 w-4 shrink-0" />
        <div class="flex-1 text-sm">{toast.message}</div>
        <button
          onclick={() => removeToast(toast.id)}
          class="focus-ring shrink-0 rounded-sm p-0.5 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>
