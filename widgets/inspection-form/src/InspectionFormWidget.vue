<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ConvexClient } from 'convex/browser';
import { useConvexQuery, typedMutation } from '@sitesync/convex-vue-client';

interface AuditEntry {
  action: string;
  userId: string;
  timestamp: number;
  detail?: string;
}

interface ChecklistItem {
  item: string;
  required: boolean;
  passed?: boolean;
  notes?: string;
  photoIds?: string[];
}

interface Inspection {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'remedial';
  checklist: ChecklistItem[];
  auditTrail: AuditEntry[];
  assigneeId?: string;
  createdBy: string;
  createdAt: number;
  completedAt?: number;
}

const props = defineProps<{
  convexUrl: string;
  inspectionId: string;
  userId: string;
  userRole: string;
  client: ConvexClient;
}>();

const showAuditTrail = ref(false);
const submitting = ref(false);
const submitError = ref('');
const completeStatus = ref<'passed' | 'failed' | 'remedial'>('passed');
const showCompleteDialog = ref(false);
const photoUploading = ref(false);

// Notes debounce — accumulate per-item timers so we only fire mutation after user stops typing
const notesTimers = ref<Record<number, ReturnType<typeof setTimeout>>>({});

// Clear any pending debounce timers on unmount to avoid stale mutations
onUnmounted(() => {
  Object.values(notesTimers.value).forEach(clearTimeout);
});

// Reactive query subscription for real-time sync
const { data: inspection, isLoading, error } = useConvexQuery(
  props.client,
  'inspections:getById',
  { inspectionId: props.inspectionId },
);

const checklist = computed(() => (inspection.value as Inspection)?.checklist || []);
const auditTrail = computed(() => (inspection.value as Inspection)?.auditTrail || []);
const inspectionStatus = computed(() => (inspection.value as Inspection)?.status || 'pending');
const inspectionTitle = computed(() => (inspection.value as Inspection)?.title || '');
const createdAt = computed(() => (inspection.value as Inspection)?.createdAt || 0);
const completedAt = computed(() => (inspection.value as Inspection)?.completedAt);

const progress = computed(() => {
  const items = checklist.value;
  if (items.length === 0) return 0;
  const completed = items.filter((i) => i.passed !== undefined).length;
  return Math.round((completed / items.length) * 100);
});

const canStart = computed(() =>
  inspectionStatus.value === 'pending' &&
  (props.userRole === 'field_engineer' || props.userRole === 'admin'),
);

const canComplete = computed(() =>
  inspectionStatus.value === 'in_progress' &&
  props.userId === (inspection.value as Inspection)?.assigneeId &&
  checklist.value.every((i) => i.passed !== undefined),
);

async function toggleItem(index: number, passed: boolean) {
  try {
    await typedMutation(props.client, 'inspections:updateChecklistItem', {
      inspectionId: props.inspectionId,
      itemIndex: index,
      passed,
    });
  } catch (err) {
    console.error('Failed to update checklist item', err);
  }
}

// Debounced notes update — fires mutation 500ms after user stops typing
function debouncedUpdateNotes(index: number, notes: string) {
  if (notesTimers.value[index]) {
    clearTimeout(notesTimers.value[index]);
  }
  notesTimers.value[index] = setTimeout(async () => {
    try {
      await typedMutation(props.client, 'inspections:updateChecklistItem', {
        inspectionId: props.inspectionId,
        itemIndex: index,
        notes,
      });
    } catch (err) {
      console.error('Failed to update notes', err);
    }
  }, 500);
}

async function handlePhotoCapture(index: number) {
  photoUploading.value = true;
  try {
    // Use HTML5 capture for mobile, file picker for desktop
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        photoUploading.value = false;
        return;
      }

      // Store as data URL via photoIds array (mutation accepts photoIds: string[])
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const existingItems = (inspection.value as Inspection)?.checklist || [];
        const existingPhotoIds = existingItems[index]?.photoIds || [];
        await typedMutation(props.client, 'inspections:updateChecklistItem', {
          inspectionId: props.inspectionId,
          itemIndex: index,
          photoIds: [...existingPhotoIds, dataUrl],
        });
        photoUploading.value = false;
      };
      reader.readAsDataURL(file);
    };
  } catch (err) {
    console.error('Photo capture failed', err);
    photoUploading.value = false;
  }
}

async function startInspection() {
  try {
    await typedMutation(props.client, 'inspections:startInspection', {
      inspectionId: props.inspectionId,
    });
  } catch (err) {
    console.error('Failed to start inspection', err);
  }
}

async function completeInspection() {
  submitting.value = true;
  submitError.value = '';
  try {
    await typedMutation(props.client, 'inspections:completeInspection', {
      inspectionId: props.inspectionId,
      status: completeStatus.value,
    });
    showCompleteDialog.value = false;
  } catch (err) {
    submitError.value = (err as Error).message;
  } finally {
    submitting.value = false;
  }
}

function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
</script>

<template>
  <div class="inspection-form">
    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="skeleton h-14 rounded-lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      {{ error instanceof Error ? error.message : 'Failed to load inspection' }}
    </div>

    <template v-else>
      <!-- Header -->
      <div class="mb-5">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ inspectionTitle }}</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Created {{ formatDate(createdAt) }}
              <span v-if="completedAt">&middot; Completed {{ formatDate(completedAt) }}</span>
            </p>
          </div>
          <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="{
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': inspectionStatus === 'pending',
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': inspectionStatus === 'in_progress',
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': inspectionStatus === 'passed',
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': inspectionStatus === 'failed',
              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': inspectionStatus === 'remedial',
            }">
            {{ inspectionStatus.replace('_', ' ') }}
          </span>
        </div>

        <!-- Progress bar -->
        <div class="mt-3">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>{{ progress }}% complete</span>
            <span>{{ checklist.filter(i => i.passed !== undefined).length }}/{{ checklist.length }} items</span>
          </div>
          <div class="mt-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div class="h-2 rounded-full bg-blue-600 transition-all duration-500" :style="{ width: progress + '%' }" />
          </div>
        </div>

        <!-- Action buttons -->
        <div class="mt-3 flex flex-wrap gap-2">
          <button v-if="canStart" @click="startInspection"
            class="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" /></svg>
            Start Inspection
          </button>
          <button v-if="canComplete" @click="showCompleteDialog = true"
            class="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            Complete Inspection
          </button>
          <button @click="showAuditTrail = !showAuditTrail"
            class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            {{ showAuditTrail ? 'Hide' : 'Show' }} Audit Trail ({{ auditTrail.length }})
          </button>
        </div>
      </div>

      <!-- Checklist items -->
      <div class="space-y-2">
        <div v-for="(item, index) in checklist" :key="index"
          class="rounded-lg border border-gray-200 p-3 transition-all dark:border-gray-700"
          :class="{ 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-900/10': item.passed === true, 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-900/10': item.passed === false }">
          <div class="flex items-start gap-3">
            <!-- Pass/Fail toggle -->
            <div class="flex shrink-0 flex-col gap-1">
              <button @click="toggleItem(index, true)"
                class="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all"
                :class="item.passed === true
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600 dark:bg-gray-800 dark:hover:bg-green-900/30'">
                ✓
              </button>
              <button @click="toggleItem(index, false)"
                class="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all"
                :class="item.passed === false
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:bg-gray-800 dark:hover:bg-red-900/30'">
                ✗
              </button>
            </div>

            <!-- Item content -->
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium"
                :class="{ 'line-through opacity-60': item.passed !== undefined }">
                {{ item.item }}
                <span v-if="item.required" class="ml-1 text-xs text-red-500" title="Required">*</span>
              </p>

              <!-- Notes field -->
              <textarea :value="item.notes || ''"
                @input="(e: any) => debouncedUpdateNotes(index, (e.target as HTMLTextAreaElement).value)"
                placeholder="Add notes..."
                class="mt-2 w-full resize-none rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:placeholder-gray-500"
                rows="1" />

              <!-- Photo thumbnails -->
              <div v-if="item.photoIds && item.photoIds.length > 0" class="mt-2 flex flex-wrap gap-1.5">
                <div v-for="(photoId, pIdx) in item.photoIds" :key="pIdx"
                  class="h-12 w-12 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                  <img :src="photoId" class="h-full w-full object-cover" alt="Inspection photo" />
                </div>
              </div>

              <!-- Photo capture button -->
              <button @click="handlePhotoCapture(index)" :disabled="photoUploading"
                class="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:hover:border-blue-500"
                :class="{ 'opacity-50': photoUploading }">
                <svg v-if="!photoUploading" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
                <span v-if="!photoUploading">Add Photo</span>
                <span v-else>Uploading...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit trail -->
      <div v-if="showAuditTrail" class="mt-5">
        <h4 class="mb-3 text-sm font-semibold text-muted-foreground">Audit Trail</h4>
        <div class="space-y-2">
          <div v-for="(entry, idx) in auditTrail" :key="idx"
            class="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-900/30">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {{ getInitials(entry.userId) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium">{{ entry.action }}</p>
              <p v-if="entry.detail" class="text-xs text-muted-foreground">{{ entry.detail }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ formatDate(entry.timestamp) }}</p>
            </div>
          </div>
          <p v-if="auditTrail.length === 0" class="text-sm text-muted-foreground">No audit entries yet.</p>
        </div>
      </div>
    </template>

    <!-- Complete dialog -->
    <div v-if="showCompleteDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showCompleteDialog = false">
      <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
        <h3 class="text-lg font-semibold">Complete Inspection</h3>
        <p class="mt-1 text-sm text-muted-foreground">All checklist items have been evaluated. Select the final result.</p>

        <div class="mt-4 space-y-2">
          <button @click="completeStatus = 'passed'"
            class="flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all"
            :class="completeStatus === 'passed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✓</span>
            <div><p class="text-sm font-medium">Passed</p><p class="text-xs text-muted-foreground">All items meet requirements</p></div>
          </button>
          <button @click="completeStatus = 'remedial'"
            class="flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all"
            :class="completeStatus === 'remedial' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">!</span>
            <div><p class="text-sm font-medium">Remedial</p><p class="text-xs text-muted-foreground">Minor issues need correction</p></div>
          </button>
          <button @click="completeStatus = 'failed'"
            class="flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all"
            :class="completeStatus === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">✗</span>
            <div><p class="text-sm font-medium">Failed</p><p class="text-xs text-muted-foreground">Critical items not met</p></div>
          </button>
        </div>

        <p v-if="submitError" class="mt-3 text-sm text-red-500">{{ submitError }}</p>

        <div class="mt-4 flex gap-2">
          <button @click="showCompleteDialog = false"
            class="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button @click="completeInspection" :disabled="submitting"
            class="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50">
            {{ submitting ? 'Submitting...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.dark .skeleton {
  background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
