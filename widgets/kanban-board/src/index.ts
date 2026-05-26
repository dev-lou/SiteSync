import { createApp } from 'vue';
import KanbanBoardWidget from './KanbanBoardWidget.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountKanbanBoard(
  container: HTMLElement,
  props: {
    convexUrl: string;
    boardId: string;
    userId: string;
    userRole: string;
    filterMine?: boolean;
  },
) {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(KanbanBoardWidget, { ...props, client });
  return app.mount(container);
}
