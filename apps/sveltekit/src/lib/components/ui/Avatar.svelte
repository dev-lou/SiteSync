<script lang="ts">
  import { cn } from '$utils/cn';

  let {
    src = '',
    alt = '',
    fallback = '',
    size = 'md' as 'sm' | 'md' | 'lg' | 'xl',
    class: className = '',
    ...rest
  }: {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  } & Record<string, unknown> = $props();

  const sizeMap: Record<string, string> = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-14 w-14 text-lg',
  };

  let imgError = $state(false);
</script>

<div
  class={cn(
    'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground',
    sizeMap[size],
    className,
  )}
  {...rest}
>
  {#if src && !imgError}
    <img {src} {alt} class="h-full w-full object-cover" onerror={() => (imgError = true)} />
  {:else}
    <span aria-hidden="true">{fallback?.slice(0, 2).toUpperCase() || '?'}</span>
  {/if}
</div>
