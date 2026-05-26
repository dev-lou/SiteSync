<script lang="ts">
  import { cn } from '$utils/cn';
  import { Loader2 } from '@lucide/svelte';

  type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  let {
    variant = 'primary' as Variant,
    size = 'md' as Size,
    loading = false,
    disabled = false,
    class: className = '',
    onclick,
    children,
    ...rest
  }: {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: import('svelte').Snippet;
  } & Record<string, unknown> = $props();
</script>

<button
  {onclick}
  disabled={disabled || loading}
  class={cn(
    'focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150',
    'disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:shadow-xs':
        variant === 'primary',
      'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
      'border border-border bg-transparent hover:bg-muted': variant === 'outline',
      'bg-transparent hover:bg-muted': variant === 'ghost',
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm':
        variant === 'destructive',
    },
    {
      'h-7 rounded-sm px-2.5 text-xs': size === 'xs',
      'h-8 rounded-sm px-3 text-sm': size === 'sm',
      'h-9 rounded-md px-4 text-sm': size === 'md',
      'h-10 rounded-md px-5 text-base': size === 'lg',
      'h-11 rounded-lg px-6 text-base': size === 'xl',
    },
    className,
  )}
  {...rest}
>
  {#if loading}
    <Loader2 class="h-4 w-4 animate-spin" />
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
