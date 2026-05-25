import { createApp } from 'vue';
import BlueprintViewerWidget from './BlueprintViewerWidget.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountBlueprintViewer(
  container: HTMLElement,
  props: { convexUrl: string; blueprintId: string; userId: string; userRole: string },
) {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(BlueprintViewerWidget, { ...props, client });
  return app.mount(container);
}
