<script lang="ts">
  import { cn } from '$utils/cn';

  let {
    content = '',
    position = 'top' as 'top' | 'bottom' | 'left' | 'right',
    class: className = '',
    children,
    ...rest
  }: {
    content?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    class?: string;
    children?: import('svelte').Snippet;
  } & Record<string, unknown> = $props();

  let visible = $state(false);

  const posClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };
</script>

<div
  class={cn('relative inline-flex', className)}
  onmouseenter={() => (visible = true)}
  onmouseleave={() => (visible = false)}
  onfocusin={() => (visible = true)}
  onfocusout={() => (visible = false)}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
  {#if visible && content}
    <div
      class={cn(
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md',
        posClasses[position],
      )}
      role="tooltip"
    >
      {content}
    </div>
  {/if}
</div>
