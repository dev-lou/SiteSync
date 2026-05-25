import { createApp } from 'vue';
import SafetyHeatmapWidget from './SafetyHeatmapWidget.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountSafetyHeatmap(
  container: HTMLElement,
  props: { convexUrl: string; projectId: string; userId: string; userRole: string },
) {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(SafetyHeatmapWidget, { ...props, client });
  return app.mount(container);
}
