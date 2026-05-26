<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useConvexQuery, typedQuery } from '@sitesync/convex-vue-client';
import type { ConvexClient } from 'convex/browser';

interface Zone {
  _id: string;
  name: string;
  svgPath: string;
  status: 'active' | 'suspended' | 'completed';
  suspendedReason?: string;
  suspendedBy?: string;
  suspendedAt?: number;
}

interface Permit {
  _id: string;
  type: string;
  status: string;
  issuedTo: string;
  expiresAt: number;
  notes?: string;
}

const props = defineProps<{
  convexUrl: string;
  projectId: string;
  userId: string;
  userRole: string;
  client: ConvexClient;
}>();

const loading = ref(true);
const selectedZone = ref<Zone | null>(null);
const hoveredZone = ref<string | null>(null);
const showPanel = ref(false);

const { data: zones, isLoading: zonesLoading } = useConvexQuery(
  props.client,
  'permits:listZonesByProject',
  { projectId: props.projectId },
);

const safeZones = computed(() => (zones.value as Zone[]) || []);

// Reactive zone permits — re-subscribe when selectedZone changes
const zonePermitsData = ref<Permit[]>([]);
const zonePermitsLoading = ref(false);
let unsubscribePermits: (() => void) | null = null;

watch(
  selectedZone,
  (zone) => {
    // Clean up previous subscription
    if (unsubscribePermits) {
      unsubscribePermits();
      unsubscribePermits = null;
    }

    const zoneId = zone?._id || '';
    if (!zoneId) {
      zonePermitsData.value = [];
      zonePermitsLoading.value = false;
      return;
    }

    zonePermitsLoading.value = true;
    unsubscribePermits = typedQuery(
      props.client,
      'permits:listByZone',
      { zoneId },
      (result: any) => {
        zonePermitsData.value = result || [];
        zonePermitsLoading.value = false;
      },
    );
  },
  { immediate: true },
);

onUnmounted(() => {
  if (unsubscribePermits) {
    unsubscribePermits();
  }
});

const safeZonePermits = computed(() => zonePermitsData.value);

const zoneColors: Record<string, string> = {
  active: '#22c55e',
  suspended: '#ef4444',
  completed: '#6b7280',
};

const zoneFillOpacities: Record<string, string> = {
  active: '0.25',
  suspended: '0.35',
  completed: '0.2',
};

// Generate sample zones if none from DB
const hasZones = computed(() => safeZones.value.length > 0);

const sampleZones: Zone[] = [
  {
    _id: 'zone-a',
    name: 'Zone A - Foundation',
    svgPath: 'M 50 50 L 200 50 L 200 180 L 50 180 Z',
    status: 'active',
  },
  {
    _id: 'zone-b',
    name: 'Zone B - Structural',
    svgPath: 'M 220 50 L 370 50 L 370 180 L 220 180 Z',
    status: 'suspended',
    suspendedReason: 'Structural integrity review',
  },
  {
    _id: 'zone-c',
    name: 'Zone C - Finishing',
    svgPath: 'M 50 200 L 200 200 L 200 320 L 50 320 Z',
    status: 'active',
  },
  {
    _id: 'zone-d',
    name: 'Zone D - MEP',
    svgPath: 'M 220 200 L 370 200 L 370 320 L 220 320 Z',
    status: 'completed',
  },
  {
    _id: 'zone-e',
    name: 'Zone E - Roof',
    svgPath: 'M 100 30 L 320 30 L 320 40 L 100 40 Z',
    status: 'active',
  },
];

const displayZones = computed(() => (hasZones.value ? safeZones.value : sampleZones));

function togglePanel(zone: Zone) {
  selectedZone.value = zone;
  showPanel.value = true;
}

function closePanel() {
  showPanel.value = false;
  selectedZone.value = null;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isExpiring(expiresAt: number): boolean {
  return expiresAt < Date.now() + 86400000;
}

onMounted(() => {
  loading.value = false;
});
</script>

<template>
  <div class="safety-heatmap relative">
    <!-- Loading state -->
    <div
      v-if="loading || zonesLoading"
      class="flex h-64 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
        />
        <p class="text-sm text-gray-500">Loading zones...</p>
      </div>
    </div>

    <template v-else>
      <!-- Legend -->
      <div class="mb-3 flex flex-wrap gap-3 text-xs">
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm" :style="{ background: zoneColors.active }" />
          Active
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm" :style="{ background: zoneColors.suspended }" />
          Suspended
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-sm" :style="{ background: zoneColors.completed }" />
          Completed
        </span>
        <span class="text-muted-foreground">&middot; {{ displayZones.length }} zones</span>
      </div>

      <!-- SVG Floor Plan -->
      <div class="relative">
        <svg
          viewBox="0 0 420 360"
          class="w-full rounded-lg border border-gray-200 dark:border-gray-700"
          style="min-height: 320px"
        >
          <!-- Background -->
          <rect
            x="0"
            y="0"
            width="420"
            height="360"
            rx="4"
            fill="#f9fafb"
            class="dark:fill-gray-800"
          />

          <!-- Grid lines for visual reference -->
          <line
            x1="0"
            y1="120"
            x2="420"
            y2="120"
            stroke="#e5e7eb"
            stroke-width="0.5"
            class="dark:stroke-gray-700"
          />
          <line
            x1="0"
            y1="240"
            x2="420"
            y2="240"
            stroke="#e5e7eb"
            stroke-width="0.5"
            class="dark:stroke-gray-700"
          />
          <line
            x1="210"
            y1="0"
            x2="210"
            y2="360"
            stroke="#e5e7eb"
            stroke-width="0.5"
            class="dark:stroke-gray-700"
          />

          <!-- Zone paths -->
          <g
            v-for="zone in displayZones"
            :key="zone._id"
            class="transition-all duration-200"
            @mouseenter="hoveredZone = zone._id"
            @mouseleave="hoveredZone = null"
            @click="togglePanel(zone)"
          >
            <path
              :d="zone.svgPath"
              :fill="zoneColors[zone.status]"
              :fill-opacity="hoveredZone === zone._id ? '0.5' : zoneFillOpacities[zone.status]"
              :stroke="hoveredZone === zone._id ? '#1f2937' : zoneColors[zone.status]"
              :stroke-width="hoveredZone === zone._id ? 2.5 : 1.5"
              class="cursor-pointer transition-all"
            />

            <!-- Lock icon for suspended zones -->
            <g v-if="zone.status === 'suspended'">
              <rect
                :x="parseFloat(zone.svgPath.match(/M\s+(\d+)/)?.[1] || '0') + 5"
                :y="parseFloat(zone.svgPath.match(/L\s+\d+\s+(\d+)/)?.[1] || '0') + 5"
                width="16"
                height="14"
                rx="2"
                fill="#ef4444"
                opacity="0.9"
              />
              <path
                :d="`M${parseFloat(zone.svgPath.match(/M\s+(\d+)/)?.[1] || '0') + 8} ${parseFloat(zone.svgPath.match(/L\s+\d+\s+(\d+)/)?.[1] || '0') + 8} V${parseFloat(zone.svgPath.match(/L\s+\d+\s+(\d+)/)?.[1] || '0') + 3} a4 4 0 0 1 8 0 v5`"
                fill="none"
                stroke="#ef4444"
                stroke-width="1.5"
              />
            </g>

            <!-- Zone label -->
            <text
              :x="parseFloat(zone.svgPath.match(/M\s+(\d+)/)?.[1] || '0') + 60"
              :y="parseFloat(zone.svgPath.match(/L\s+\d+\s+(\d+)/)?.[1] || '0') + 20"
              text-anchor="middle"
              class="pointer-events-none fill-gray-700 text-[9px] font-medium dark:fill-gray-300"
              v-if="hoveredZone === zone._id"
            >
              {{ zone.name }}
            </text>
          </g>

          <!-- Tooltip on hover -->
          <g v-if="hoveredZone">
            <rect
              x="10"
              y="5"
              width="200"
              height="48"
              rx="4"
              fill="white"
              stroke="#e5e7eb"
              stroke-width="0.5"
              class="dark:fill-gray-900 dark:stroke-gray-700"
            />
            <text x="18" y="22" class="fill-gray-900 text-[10px] font-semibold dark:fill-gray-100">
              {{ displayZones.find((z) => z._id === hoveredZone)?.name }}
            </text>
            <text x="18" y="38" class="fill-gray-500 text-[9px] dark:fill-gray-400">
              Status: {{ displayZones.find((z) => z._id === hoveredZone)?.status }}
            </text>
            <text x="18" y="50" class="fill-gray-500 text-[9px] dark:fill-gray-400">
              {{
                displayZones.find((z) => z._id === hoveredZone)?.suspendedReason ||
                'Click to view permits'
              }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Zone info slide-over panel -->
      <div
        v-if="showPanel && selectedZone"
        class="fixed inset-y-0 right-0 z-40 w-full max-w-md transform border-l border-gray-200 bg-white shadow-xl transition-transform dark:border-gray-700 dark:bg-gray-900"
        :class="showPanel ? 'translate-x-0' : 'translate-x-full'"
      >
        <div class="flex h-full flex-col">
          <!-- Panel header -->
          <div
            class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700"
          >
            <div>
              <h3 class="text-base font-semibold">{{ selectedZone.name }}</h3>
              <span
                class="inline-flex items-center gap-1 text-xs"
                :class="{
                  'text-green-600 dark:text-green-400': selectedZone.status === 'active',
                  'text-red-600 dark:text-red-400': selectedZone.status === 'suspended',
                  'text-gray-500 dark:text-gray-400': selectedZone.status === 'completed',
                }"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :style="{ background: zoneColors[selectedZone.status] }"
                />
                {{ selectedZone.status }}
              </span>
            </div>
            <button
              @click="closePanel"
              class="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Panel body -->
          <div class="flex-1 overflow-y-auto p-4">
            <div
              v-if="selectedZone.suspendedReason"
              class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-900/20"
            >
              <p class="font-medium text-red-700 dark:text-red-400">Suspension Reason</p>
              <p class="mt-1 text-red-600 dark:text-red-300">{{ selectedZone.suspendedReason }}</p>
            </div>

            <h4 class="text-muted-foreground mb-2 text-sm font-semibold">Active Permits</h4>
            <div v-if="safeZonePermits.length > 0" class="space-y-2">
              <div
                v-for="permit in safeZonePermits"
                :key="permit._id"
                class="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-700"
                :class="{
                  'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10':
                    isExpiring(permit.expiresAt),
                }"
              >
                <div>
                  <p class="text-sm font-medium">{{ permit.type.replace('_', ' ') }}</p>
                  <p class="text-muted-foreground text-xs">
                    Expires {{ formatDate(permit.expiresAt) }}
                    <span
                      v-if="isExpiring(permit.expiresAt)"
                      class="text-yellow-600 dark:text-yellow-400"
                      >(soon)</span
                    >
                  </p>
                </div>
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                      permit.status === 'active',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                      permit.status === 'applied',
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                      permit.status === 'expired',
                  }"
                >
                  {{ permit.status }}
                </span>
              </div>
            </div>
            <div v-else>
              <div
                class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 dark:border-gray-700"
              >
                <svg
                  class="mb-2 h-8 w-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
                <p class="text-muted-foreground text-sm">No permits for this zone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overlay for panel -->
      <div v-if="showPanel" class="fixed inset-0 z-30 bg-black/20" @click="closePanel" />
    </template>
  </div>
</template>

<style scoped>
text {
  font-family: system-ui, sans-serif;
  user-select: none;
}
</style>
