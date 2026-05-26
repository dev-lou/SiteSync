<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useConvexQuery } from '@sitesync/convex-vue-client';
import type { ConvexClient } from 'convex/browser';

interface Revision {
  _id: string;
  revisionNumber: number;
  fileUrl?: string;
  changeLog?: string;
  uploadedAt: number;
}

interface Blueprint {
  _id: string;
  title: string;
  description?: string;
  currentRevision: number;
  status: string;
}

const props = defineProps<{
  convexUrl: string;
  blueprintId: string;
  userId: string;
  userRole: string;
  client: ConvexClient;
}>();

const viewerContainer = ref<HTMLElement | null>(null);
const loading = ref(true);
const error = ref('');
const selectedRevision = ref<number | null>(null);
const isFullscreen = ref(false);
const showRevisions = ref(false);
const zoomLevel = ref(1);
let viewer: any = null;

// Fetch blueprint data reactively
const { data: blueprint, isLoading: bpLoading } = useConvexQuery(
  props.client,
  'blueprints:getById',
  { blueprintId: props.blueprintId },
);

const { data: revisions, isLoading: revLoading } = useConvexQuery(
  props.client,
  'blueprints:getRevisions',
  { blueprintId: props.blueprintId },
);

const safeRevisions = computed(() => (revisions.value as Revision[]) || []);
const safeBlueprint = computed(() => blueprint.value as Blueprint | null);

const activeRevision = computed(() => {
  if (selectedRevision.value !== null) {
    return safeRevisions.value.find((r) => r.revisionNumber === selectedRevision.value);
  }
  return safeRevisions.value[0] || null;
});

// Extracted init function — can be called from onMounted and from retry button
async function initViewer() {
  // Destroy existing viewer if re-initializing (e.g. retry)
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }

  loading.value = true;
  error.value = '';
  try {
    const OpenSeadragon = await import('openseadragon');
    if (viewerContainer.value) {
      viewer = OpenSeadragon.default({
        element: viewerContainer.value,
        prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@5/build/openseadragon/images/',
        tileSources: {
          type: 'image',
          url:
            activeRevision.value?.fileUrl ||
            'https://via.placeholder.com/1600x1200.png?text=Blueprint',
        },
        showNavigator: true,
        navigatorPosition: 'BOTTOM_LEFT',
        degrees: 0,
        minZoom: 0.3,
        maxZoom: 15,
        zoomPerClick: 1.5,
        animationTime: 0.3,
        gestureSettingsTouch: { pinchToZoom: true, flickEnabled: true },
      });

      // Track zoom changes
      viewer.addHandler('zoom', () => {
        if (viewer) zoomLevel.value = Math.round(viewer.viewport.getZoom() * 10) / 10;
      });
    }
    loading.value = false;
  } catch (err) {
    error.value = 'Failed to load blueprint viewer';
    loading.value = false;
  }
}

onMounted(() => {
  initViewer();
});

onUnmounted(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});

// Watch activeRevision for late-arriving data or revision switches
watch(activeRevision, (newRev) => {
  if (viewer && newRev?.fileUrl) {
    viewer.open({
      type: 'image',
      url: newRev.fileUrl,
    });
  } else if (viewer && !newRev) {
    viewer.open({
      type: 'image',
      url: 'https://via.placeholder.com/1600x1200.png?text=No+Image',
    });
  }
});

function switchRevision(rev: Revision) {
  selectedRevision.value = rev.revisionNumber;
  // activeRevision computed changes → watch triggers viewer.open()
  showRevisions.value = false;
}

function zoomIn() {
  if (viewer) viewer.viewport.zoomBy(1.4);
}

function zoomOut() {
  if (viewer) viewer.viewport.zoomBy(0.7);
}

function resetZoom() {
  if (viewer) viewer.viewport.goHome(true);
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  if (viewer) {
    setTimeout(() => viewer.viewport.goHome(true), 100);
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="blueprint-viewer relative" :class="{ 'fixed inset-0 z-50 bg-black': isFullscreen }">
    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex h-96 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
        />
        <p class="text-sm text-gray-500">Loading blueprint viewer...</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex h-96 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
    >
      <p class="text-sm text-red-500">{{ error }}</p>
      <button
        @click="initViewer()"
        class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold">{{ safeBlueprint?.title || 'Blueprint' }}</h3>
          <span
            v-if="safeBlueprint"
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            :class="{
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400':
                safeBlueprint.status === 'draft',
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                safeBlueprint.status === 'in_review',
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                safeBlueprint.status === 'approved',
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
                safeBlueprint.status === 'for_construction',
            }"
          >
            {{ safeBlueprint.status.replace('_', ' ') }}
          </span>
        </div>

        <!-- Zoom controls -->
        <div
          class="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
        >
          <button
            @click="zoomOut"
            title="Zoom out"
            class="flex h-7 w-7 items-center justify-center rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            −
          </button>
          <span
            class="min-w-[3rem] text-center text-xs font-medium text-gray-600 dark:text-gray-400"
            >{{ zoomLevel }}x</span
          >
          <button
            @click="zoomIn"
            title="Zoom in"
            class="flex h-7 w-7 items-center justify-center rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            +
          </button>
          <button
            @click="resetZoom"
            title="Reset zoom"
            class="flex h-7 w-7 items-center justify-center rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ⌂
          </button>
          <button
            @click="toggleFullscreen"
            title="Fullscreen"
            class="flex h-7 w-7 items-center justify-center rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {{ isFullscreen ? '⊠' : '⛶' }}
          </button>
        </div>
      </div>

      <!-- Info bar -->
      <div class="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span
          >Rev {{ activeRevision?.revisionNumber || safeBlueprint?.currentRevision || '—' }}</span
        >
        <span v-if="activeRevision?.uploadedAt"
          >&middot; {{ formatDate(activeRevision.uploadedAt) }}</span
        >
        <span v-if="activeRevision?.changeLog" class="italic"
          >&middot; "{{ activeRevision.changeLog }}"</span
        >

        <!-- Revision switcher -->
        <button
          @click="showRevisions = !showRevisions"
          class="ml-auto inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <svg
            class="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Revisions ({{ safeRevisions.length }})
        </button>
      </div>

      <!-- Viewer container -->
      <div class="relative" :class="{ 'h-dvh': isFullscreen }">
        <div
          ref="viewerContainer"
          class="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
          :class="isFullscreen ? 'h-full rounded-none border-0' : 'h-[500px]'"
        />

        <!-- Empty state -->
        <div v-if="!loading && !viewer" class="flex h-32 items-center justify-center">
          <p class="text-muted-foreground text-sm">Select a revision to view</p>
        </div>
      </div>

      <!-- Revision dropdown -->
      <div
        v-if="showRevisions"
        class="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="max-h-48 overflow-y-auto p-2">
          <button
            v-for="rev in safeRevisions"
            :key="rev._id"
            @click="switchRevision(rev)"
            class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            :class="{
              'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400':
                rev.revisionNumber === activeRevision?.revisionNumber,
            }"
          >
            <div>
              <p class="font-medium">Revision {{ rev.revisionNumber }}</p>
              <p v-if="rev.changeLog" class="text-muted-foreground text-xs">{{ rev.changeLog }}</p>
            </div>
            <span class="text-muted-foreground text-xs">{{ formatDate(rev.uploadedAt) }}</span>
          </button>
          <p
            v-if="safeRevisions.length === 0"
            class="text-muted-foreground p-3 text-center text-sm"
          >
            No revisions uploaded yet.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
