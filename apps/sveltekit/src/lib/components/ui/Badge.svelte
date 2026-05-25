<script lang="ts">
  import { cn } from '$utils/cn';

  type Variant = 'default' | 'success' | 'warning' | 'danger' | 'outline';
  type Size = 'sm' | 'md';

  let {
    variant = 'default' as Variant,
    size = 'sm' as Size,
    class: className = '',
    children,
    ...rest
  }: {
    variant?: Variant;
    size?: Size;
    class?: string;
    children?: import('svelte').Snippet;
  } & Record<string, unknown> = $props();
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full font-medium',
    {
      'bg-primary/10 text-primary': variant === 'default',
      'bg-success/10 text-success': variant === 'success',
      'bg-warning/10 text-warning': variant === 'warning',
      'bg-danger/10 text-danger': variant === 'danger',
      'border border-border bg-transparent text-muted-foreground': variant === 'outline',
    },
    {
      'h-5 px-2 text-xs': size === 'sm',
      'h-6 px-2.5 text-sm': size === 'md',
    },
    className,
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</span>
