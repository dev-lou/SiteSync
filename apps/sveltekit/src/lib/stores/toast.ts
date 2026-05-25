import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export const toasts = writable<Toast[]>([]);

export function addToast(type: Toast['type'], message: string, duration = 5000) {
  const id = `toast-${Math.random().toString(36).slice(2, 9)}`;
  toasts.update((t) => [...t, { id, type, message, duration }]);

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }

  return id;
}

export function removeToast(id: string) {
  toasts.update((t) => t.filter((toast) => toast.id !== id));
}
