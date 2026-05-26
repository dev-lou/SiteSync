<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConvexQuery, typedMutation } from '@sitesync/convex-vue-client';
import type { ConvexClient } from 'convex/browser';

interface Column {
  id: string;
  title: string;
  order: number;
}

interface Card {
  _id: string;
  columnId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  order: number;
  status: string;
  blockedReason?: string;
  dueDate?: number;
  linkedDeliveryId?: string;
  linkedInspectionId?: string;
  linkedBlueprintId?: string;
}

const props = defineProps<{
  convexUrl: string;
  boardId: string;
  userId: string;
  userRole: string;
  filterMine?: boolean;
  client: ConvexClient;
}>();

const loading = ref(true);
const draggingCard = ref<Card | null>(null);
const dragOverColumn = ref<string | null>(null);
const filterMine = ref(props.filterMine || false);

const { data: boardData, isLoading: boardLoading } = useConvexQuery(
  props.client,
  'kanban:getBoardById',
  { boardId: props.boardId },
);

const { data: cardsData, isLoading: cardsLoading } = useConvexQuery(
  props.client,
  'kanban:getCardsByBoard',
  { boardId: props.boardId },
);

interface BoardData {
  _id: string;
  title: string;
  columns: Column[];
}

const safeBoard = computed(() => boardData.value as BoardData | undefined);
const safeCards = computed(() => (cardsData.value as Card[]) || []);

const columns = computed<Column[]>(() => {
  const cols = (safeBoard.value?.columns as Column[]) || [];
  return cols.sort((a, b) => a.order - b.order);
});

const filteredCards = computed(() => {
  let result = safeCards.value;
  if (filterMine.value) {
    result = result.filter((c) => c.assigneeId === props.userId);
  }
  // Show all statuses, including blocked - visually indicate blocked
  return result;
});

const cardsByColumn = computed(() => {
  const map: Record<string, Card[]> = {};
  for (const col of columns.value) {
    map[col.id] = filteredCards.value
      .filter((c) => c.columnId === col.id)
      .sort((a, b) => a.order - b.order);
  }
  return map;
});

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const priorityBorders: Record<string, string> = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  critical: 'border-l-red-400',
};

const columnEmpties: Record<string, { icon: string; text: string }> = {
  backlog: { icon: '📋', text: 'No items in backlog' },
  ready: { icon: '✅', text: 'No items ready' },
  in_progress: { icon: '⚡', text: 'Nothing in progress' },
  qc: { icon: '🔍', text: 'Nothing in QC' },
  done: { icon: '🎉', text: 'Nothing completed yet' },
  blocked: { icon: '🚫', text: 'No blocked items' },
};

const defaultEmpty = { icon: '📝', text: 'No cards here' };

onMounted(() => {
  loading.value = false;
});

function onDragStart(card: Card) {
  draggingCard.value = card;
}

function onDragEnd() {
  draggingCard.value = null;
  dragOverColumn.value = null;
}

function onDragOver(columnId: string) {
  dragOverColumn.value = columnId;
}

function onDragLeave(columnId: string) {
  if (dragOverColumn.value === columnId) {
    dragOverColumn.value = null;
  }
}

async function onDrop(columnId: string) {
  if (!draggingCard.value) return;
  const card = draggingCard.value;
  if (card.columnId === columnId) return; // No change

  const colCards = cardsByColumn.value[columnId] || [];
  const newOrder = colCards.length;

  try {
    await typedMutation(props.client, 'kanban:moveCard', {
      cardId: card._id,
      columnId,
      order: newOrder,
    });
    // Optimistic update - the reactive query will confirm
    card.columnId = columnId;
    card.order = newOrder;
  } catch (err) {
    console.error('Failed to move card', err);
  } finally {
    draggingCard.value = null;
    dragOverColumn.value = null;
  }
}

function formatDate(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getAssigneeInitials(id: string): string {
  return id.substring(0, 2).toUpperCase();
}

function getEmptyState(columnId: string) {
  // Extract the status from the column id (columns might be named by status)
  const statusKey = columnId.replace(/[_-]/g, '_');
  return columnEmpties[statusKey] || defaultEmpty;
}
</script>

<template>
  <div class="kanban-board">
    <!-- Loading state -->
    <div
      v-if="loading || boardLoading || cardsLoading"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
        />
        <p class="text-sm text-gray-500">Loading board...</p>
      </div>
    </div>

    <!-- Board content (toolbar + columns or empty) -->
    <div v-else>
      <!-- Toolbar -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-muted-foreground text-sm font-semibold">
          {{ safeBoard?.title || 'Kanban Board' }}
        </h3>
        <div class="flex items-center gap-2">
          <label class="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              v-model="filterMine"
              class="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            My tasks only
          </label>
          <span class="text-muted-foreground text-xs"> {{ filteredCards.length }} cards </span>
        </div>
      </div>

      <!-- Board columns -->
      <div
        v-if="columns.length > 0"
        class="flex gap-4 overflow-x-auto pb-4"
        style="scrollbar-width: thin"
      >
        <div
          v-for="col in columns"
          :key="col.id"
          class="max-w-[320px] min-w-[270px] flex-shrink-0"
          @dragover.prevent="onDragOver(col.id)"
          @dragleave="onDragLeave(col.id)"
          @drop="onDrop(col.id)"
        >
          <!-- Column header -->
          <div class="mb-2 flex items-center justify-between px-1">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ col.title }}</h4>
            <span
              class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {{ cardsByColumn[col.id]?.length || 0 }}
            </span>
          </div>

          <!-- Column body -->
          <div
            class="min-h-[200px] space-y-2 rounded-lg p-2 transition-colors"
            :class="[
              dragOverColumn === col.id
                ? 'bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-700'
                : 'bg-gray-50 dark:bg-gray-800/50',
            ]"
          >
            <!-- Cards with transition -->
            <TransitionGroup name="card" tag="div" class="space-y-2">
              <div
                v-for="card in cardsByColumn[col.id]"
                :key="card._id"
                draggable="true"
                @dragstart="onDragStart(card)"
                @dragend="onDragEnd"
                class="cursor-grab rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900"
                :class="[
                  priorityBorders[card.priority] || 'border-l-gray-400',
                  draggingCard?._id === card._id ? 'rotate-2 opacity-50 shadow-lg' : '',
                  card.blockedReason ? 'border-red-300 dark:border-red-700' : '',
                ]"
              >
                <!-- Card content -->
                <div class="p-3">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ card.title }}
                    </p>
                    <span
                      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
                      :class="priorityColors[card.priority]"
                    >
                      {{ card.priority }}
                    </span>
                  </div>

                  <p
                    v-if="card.description"
                    class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ card.description }}
                  </p>

                  <!-- Card metadata -->
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      v-if="card.assigneeId"
                      class="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium"
                      :title="'Assignee: ' + card.assigneeId"
                    >
                      {{ getAssigneeInitials(card.assigneeId) }}
                    </span>
                    <span v-if="card.dueDate" class="text-muted-foreground text-[10px]"
                      >📅 {{ formatDate(card.dueDate) }}</span
                    >
                    <span
                      v-if="card.linkedDeliveryId"
                      class="text-[10px] text-blue-500"
                      title="Linked to delivery"
                      >📦</span
                    >
                    <span
                      v-if="card.linkedInspectionId"
                      class="text-[10px] text-green-500"
                      title="Linked to inspection"
                      >🔍</span
                    >
                    <span
                      v-if="card.linkedBlueprintId"
                      class="text-[10px] text-purple-500"
                      title="Linked to blueprint"
                      >📐</span
                    >
                  </div>

                  <div
                    v-if="card.blockedReason"
                    class="mt-2 rounded bg-red-50 px-2 py-1 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  >
                    🚫 {{ card.blockedReason }}
                  </div>
                </div>
              </div>
            </TransitionGroup>

            <div
              v-if="!cardsByColumn[col.id]?.length"
              class="flex flex-col items-center justify-center py-10 text-center"
            >
              <span class="mb-1 text-xl">{{ getEmptyState(col.id).icon }}</span>
              <p class="text-xs text-gray-400">{{ getEmptyState(col.id).text }}</p>
              <p class="mt-1 text-[10px] text-gray-300 dark:text-gray-500">Drag cards here</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty board state -->
      <div
        v-else
        class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 dark:border-gray-700"
      >
        <span class="mb-2 text-3xl">📋</span>
        <p class="text-muted-foreground text-sm font-medium">No columns configured yet</p>
        <p class="text-muted-foreground mt-1 text-xs">Set up columns in the board settings</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* TransitionGroup animations */
.card-move {
  transition: transform 0.3s ease;
}
.card-enter-active {
  transition: all 0.3s ease;
  transition-delay: 0.05s;
}
.card-leave-active {
  transition: all 0.2s ease;
}
.card-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
.card-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
