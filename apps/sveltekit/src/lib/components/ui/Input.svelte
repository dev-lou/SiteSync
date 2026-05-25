<script lang="ts">
  import { cn } from '$utils/cn';

  let {
    label = '',
    error = '',
    hint = '',
    class: className = '',
    id = '',
    value = '',
    type = 'text' as string,
    placeholder = '',
    oninput,
    ...rest
  }: {
    label?: string;
    error?: string;
    hint?: string;
    class?: string;
    id?: string;
    value?: string;
    type?: string;
    placeholder?: string;
    oninput?: (e: Event) => void;
  } & Record<string, unknown> = $props();

  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
  {#if label}
    <label for={inputId} class="text-sm font-medium text-foreground">{label}</label>
  {/if}
  <input
    {type}
    {placeholder}
    {value}
    {oninput}
    {id}
    class={cn(
      'focus-ring flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground',
      'placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
      !error ? 'border-input' : 'border-danger',
    )}
    {...rest}
  />
  {#if error}
    <p class="text-xs text-danger">{error}</p>
  {:else if hint}
    <p class="text-xs text-muted-foreground">{hint}</p>
  {/if}
</div>
