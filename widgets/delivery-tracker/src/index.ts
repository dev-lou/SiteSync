import { createApp, type ComponentPublicInstance } from 'vue';
import DeliveryTrackerWidget from './DeliveryTrackerWidget.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountDeliveryTracker(
  container: HTMLElement,
  props: {
    convexUrl: string;
    projectId: string;
    userId: string;
    userRole: string;
  },
): ComponentPublicInstance {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(DeliveryTrackerWidget, { ...props, client });
  const instance = app.mount(container);
  return instance;
}

export function unmountDeliveryTracker(instance: ComponentPublicInstance): void {
  // Vue auto-unmounts when the container is removed
}
