<script lang="ts">
  import { cn } from '$utils/cn';

  type Variant = 'text' | 'circle' | 'rect';

  let {
    variant = 'text' as Variant,
    width = '100%',
    height = 'auto',
    class: className = '',
    ...rest
  }: {
    variant?: Variant;
    width?: string;
    height?: string;
    class?: string;
  } & Record<string, unknown> = $props();
</script>

<div
  class={cn(
    'skeleton rounded-sm',
    {
      'h-4 w-full rounded-sm': variant === 'text',
      'rounded-full': variant === 'circle',
      'rounded-md': variant === 'rect',
    },
    className,
  )}
  style={variant === 'text' ? undefined : `width: ${width}; height: ${height}`}
  {...rest}
></div>
