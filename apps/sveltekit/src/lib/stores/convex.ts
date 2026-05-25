import { ConvexClient } from 'convex/browser';
import { writable } from 'svelte/store';

export const convexUrl = writable<string>(
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONVEX_URL
    ? import.meta.env.VITE_CONVEX_URL
    : 'http://localhost:3210',
);

let client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient {
  if (!client) {
    let url: string;
    convexUrl.subscribe((v) => (url = v))();
    client = new ConvexClient(url ?? 'http://localhost:3210');
  }
  return client;
}

export function resetConvexClient(): void {
  if (client) {
    client.close();
    client = null;
  }
}
