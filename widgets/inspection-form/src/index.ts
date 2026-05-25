import { createApp, type ComponentPublicInstance } from 'vue';
import InspectionFormWidget from './InspectionFormWidget.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountInspectionForm(
  container: HTMLElement,
  props: { convexUrl: string; inspectionId: string; userId: string; userRole: string },
): ComponentPublicInstance {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(InspectionFormWidget, { ...props, client });
  return app.mount(container);
}
