<script lang="ts">
  import { cn } from '$utils/cn';

  type Variant = 'default' | 'interactive';
  type Padding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

  let {
    variant = 'default' as Variant,
    padding = 'md' as Padding,
    class: className = '',
    children,
    ...rest
  }: {
    variant?: Variant;
    padding?: Padding;
    class?: string;
    children?: import('svelte').Snippet;
  } & Record<string, unknown> = $props();
</script>

<div
  class={cn(
    'rounded-lg border bg-background text-foreground shadow-sm',
    {
      'hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer':
        variant === 'interactive',
    },
    {
      'p-0': padding === 'none',
      'p-3': padding === 'sm',
      'p-4': padding === 'md',
      'p-5': padding === 'lg',
      'p-6': padding === 'xl',
    },
    className,
  )}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</div>
