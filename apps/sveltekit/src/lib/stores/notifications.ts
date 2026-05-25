import { writable, derived, type Readable } from 'svelte/store';
import { getConvexClient } from './convex';

export type NotificationType =
  | 'delivery'
  | 'inspection'
  | 'permit'
  | 'blueprint'
  | 'task'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: number;
  expiresAt?: number;
}

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
}

function createNotificationStore() {
  const { subscribe, set, update } = writable<NotificationState>({
    items: [],
    unreadCount: 0,
    loading: false,
  });

  let unsubscribeQuery: (() => void) | null = null;
  let currentUserId = '';

  return {
    subscribe,
    set,

    /** Subscribe to real-time notification stream from Convex */
    async subscribeToUpdates(userId: string) {
      currentUserId = userId;
      update((s) => ({ ...s, loading: true }));
      const client = getConvexClient();
      unsubscribeQuery = client.onUpdate(
        'notifications:listByUser' as any,
        { userId },
        (result: unknown) => {
          const items = (result as Notification[]) || [];
          update(() => ({
            items,
            unreadCount: items.filter((n) => !n.read).length,
            loading: false,
          }));
        },
      );
    },

    /** Mark a single notification as read */
    async markRead(notificationId: string) {
      update((s) => ({
        ...s,
        items: s.items.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
      try {
        const client = getConvexClient();
        await client.mutation('notifications:markRead' as any, { notificationId });
      } catch {
        // Optimistic update failed — will correct on next subscription callback
      }
    },

    /** Mark all notifications as read */
    async markAllRead() {
      update((s) => ({
        ...s,
        items: s.items.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
      try {
        const client = getConvexClient();
        await client.mutation('notifications:markAllRead' as any, { userId: currentUserId });
      } catch {
        // Optimistic update failed — will correct on next subscription callback
      }
    },

    /** Add a local notification (for optimistic display) */
    addLocal(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
      const id = `notif-${Math.random().toString(36).slice(2, 9)}`;
      update((s) => ({
        ...s,
        items: [{ ...notification, id, createdAt: Date.now(), read: false }, ...s.items],
        unreadCount: s.unreadCount + 1,
      }));
    },

    /** Cleanup subscriptions */
    disconnect() {
      if (unsubscribeQuery) {
        unsubscribeQuery();
        unsubscribeQuery = null;
      }
    },

    /** Clear all notifications */
    clear() {
      set({ items: [], unreadCount: 0, loading: false });
    },
  };
}

export const notifications = createNotificationStore();
