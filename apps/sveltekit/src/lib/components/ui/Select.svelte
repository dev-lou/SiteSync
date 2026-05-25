<script lang="ts">
  import { cn } from '$utils/cn';
  import { ChevronDown } from '@lucide/svelte';

  interface Option {
    value: string;
    label: string;
  }

  let {
    label = '',
    error = '',
    options = [] as Option[],
    value = '',
    placeholder = 'Select...',
    class: className = '',
    onchange,
    ...rest
  }: {
    label?: string;
    error?: string;
    options?: Option[];
    value?: string;
    placeholder?: string;
    class?: string;
    onchange?: (e: Event) => void;
  } & Record<string, unknown> = $props();

  const inputId = `select-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
  {#if label}
    <label for={inputId} class="text-sm font-medium text-foreground">{label}</label>
  {/if}
  <div class="relative">
    <select
      {value} {onchange} {id}
      class={cn(
        'focus-ring flex h-9 w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm text-foreground',
        !error ? 'border-input' : 'border-danger',
      )}
      {...rest}
    >
      <option value="" disabled>{placeholder}</option>
      {#each options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
  {#if error}
    <p class="text-xs text-danger">{error}</p>
  {/if}
</div>
