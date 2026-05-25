<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { ConvexClient } from 'convex/browser';
import { useConvexQuery, typedMutation } from '@sitesync/convex-vue-client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Material {
  name: string;
  quantity: number;
  unit: string;
}

interface Delivery {
  _id: string;
  title: string;
  supplier: string;
  materialList: Material[];
  status: 'ordered' | 'dispatched' | 'in_transit' | 'on_site' | 'received_inspected';
  eta: number;
  actualArrival?: number;
  notes?: string;
  receiptPhoto?: string;
  signature?: string;
  receivedBy?: string;
  createdAt: number;
  updatedAt: number;
}

const props = defineProps<{
  convexUrl: string;
  projectId: string;
  userId: string;
  userRole: string;
  client: ConvexClient;
  deliveryId?: string;
}>();

// --- Reactive queries ---
const { data: deliveriesData, isLoading } = useConvexQuery(
  props.client,
  'deliveries:listByProject',
  { projectId: props.projectId },
);

const deliveries = computed(() => (deliveriesData.value as Delivery[]) || []);
const loading = computed(() => isLoading.value);

const activeTab = ref<'all' | 'ordered' | 'in_transit' | 'on_site' | 'received'>('all');

const filteredDeliveries = computed(() => {
  const all = deliveries.value;
  switch (activeTab.value) {
    case 'ordered': return all.filter(d => d.status === 'ordered' || d.status === 'dispatched');
    case 'in_transit': return all.filter(d => d.status === 'in_transit');
    case 'on_site': return all.filter(d => d.status === 'on_site');
    case 'received': return all.filter(d => d.status === 'received_inspected');
    default: return all;
  }
});

// --- Receipt confirmation state ---
const selectedDelivery = ref<Delivery | null>(null);
const showReceiptModal = ref(false);
const capturedPhoto = ref<string | null>(null);
const signatureDataUrl = ref<string | null>(null);
const isDrawing = ref(false);
const isSubmitting = ref(false);
const receiptError = ref('');
const photoUploading = ref(false);

// Signature canvas ref
const canvasRef = ref<HTMLCanvasElement | null>(null);
let sigContext: CanvasRenderingContext2D | null = null;
let sigPoints: { x: number; y: number }[] = [];

// --- Leaflet map state ---
const mapContainer = ref<HTMLElement | null>(null);
let mapInstance: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;
const truckIcon = L.divIcon({
  html: '<div style="font-size:24px;transform:rotate(0deg)">🚚</div>',
  className: 'truck-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Simulated truck positions (local only, not persisted)
const truckPositions = ref<Record<string, { lat: number; lng: number; heading: number }>>({});
let simulationInterval: ReturnType<typeof setInterval> | null = null;

// Center on project location (simulated)
const mapCenter: [number, number] = [39.8283, -98.5795]; // US center as default
const mapZoom = 5;

const statusLabels: Record<string, string> = {
  ordered: 'Ordered',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  on_site: 'On Site',
  received_inspected: 'Received',
};

const statusColors: Record<string, string> = {
  ordered: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  dispatched: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_transit: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  on_site: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  received_inspected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const statusProgress: Record<string, number> = {
  ordered: 20,
  dispatched: 40,
  in_transit: 60,
  on_site: 80,
  received_inspected: 100,
};

// --- Computed ---
const inTransitDeliveries = computed(() =>
  deliveries.value.filter(d => d.status === 'in_transit')
);

const onSiteDeliveries = computed(() =>
  deliveries.value.filter(d => d.status === 'on_site')
);

// Initialize truck positions for in-transit deliveries
function initTruckPositions() {
  const inTransit = inTransitDeliveries.value;
  for (const d of inTransit) {
    if (!truckPositions.value[d._id]) {
      // Random position between center and destination
      const lat = mapCenter[0] + (Math.random() - 0.5) * 10;
      const lng = mapCenter[1] + (Math.random() - 0.5) * 15;
      truckPositions.value = {
        ...truckPositions.value,
        [d._id]: { lat, lng, heading: Math.random() * 360 },
      };
    }
  }
}

// Simulate truck movement
function startSimulation() {
  if (simulationInterval) return;
  simulationInterval = setInterval(() => {
    const updates: Record<string, { lat: number; lng: number; heading: number }> = {};
    let changed = false;
    for (const d of inTransitDeliveries.value) {
      const pos = truckPositions.value[d._id];
      if (pos) {
        const latDelta = (Math.random() - 0.5) * 0.1;
        const lngDelta = (Math.random() - 0.5) * 0.1;
        const heading = Math.atan2(latDelta, lngDelta) * (180 / Math.PI);
        updates[d._id] = {
          lat: pos.lat + latDelta,
          lng: pos.lng + lngDelta,
          heading: pos.heading + (Math.random() - 0.5) * 20,
        };
        changed = true;
      }
    }
    if (changed) {
      truckPositions.value = { ...truckPositions.value, ...updates };
      updateMarkers();
    }
  }, 2000);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// Update Leaflet markers
function updateMarkers() {
  if (!markersLayer || !mapInstance) return;
  markersLayer.clearLayers();

  // Add markers for in-transit deliveries
  for (const d of inTransitDeliveries.value) {
    const pos = truckPositions.value[d._id];
    if (pos) {
      const rotatedIcon = L.divIcon({
        html: `<div style="font-size:24px;transform:rotate(${pos.heading}deg)">🚚</div>`,
        className: 'truck-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const marker = L.marker([pos.lat, pos.lng], { icon: rotatedIcon })
        .bindPopup(`<b>${d.title}</b><br/>${d.supplier}<br/>ETA: ${formatDate(d.eta)}`);
      markersLayer.addLayer(marker);
    }
  }

  // Add markers for on-site deliveries
  for (const d of onSiteDeliveries.value) {
    const pos = truckPositions.value[d._id] || {
      lat: mapCenter[0] + (Math.random() - 0.5) * 2,
      lng: mapCenter[1] + (Math.random() - 0.5) * 3,
      heading: 0,
    };
    if (!truckPositions.value[d._id]) {
      truckPositions.value = { ...truckPositions.value, [d._id]: pos };
    }
    const marker = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({
        html: '<div style="font-size:24px">📍</div>',
        className: 'onsite-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).bindPopup(`<b>${d.title}</b><br/>On site - ready for receipt`);
    markersLayer.addLayer(marker);
  }
}

// --- Leaflet init ---
function initMap() {
  if (mapInstance || !mapContainer.value) return;

  mapInstance = L.map(mapContainer.value, {
    center: mapCenter,
    zoom: mapZoom,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);
  initTruckPositions();
  updateMarkers();
  startSimulation();

  // Fix map rendering after container is visible
  setTimeout(() => mapInstance?.invalidateSize(), 500);
}

function destroyMap() {
  stopSimulation();
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  markersLayer = null;
}

// --- Receipt confirmation ---
function openReceipt(delivery: Delivery) {
  selectedDelivery.value = delivery;
  capturedPhoto.value = null;
  signatureDataUrl.value = null;
  receiptError.value = '';
  showReceiptModal.value = true;

  nextTick(() => {
    initCanvas();
  });
}

function closeReceipt() {
  showReceiptModal.value = false;
  selectedDelivery.value = null;
  capturedPhoto.value = null;
  signatureDataUrl.value = null;
  sigPoints = [];
}

// Camera capture
function capturePhoto() {
  photoUploading.value = true;
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

    const reader = new FileReader();
    reader.onload = (e) => {
      capturedPhoto.value = e.target?.result as string;
      photoUploading.value = false;
    };
    reader.readAsDataURL(file);
  };
}

// Signature canvas
function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.parentElement?.getBoundingClientRect();
  const width = Math.min(rect?.width || 320, 400);
  canvas.width = width;
  canvas.height = 160;

  sigContext = canvas.getContext('2d');
  if (!sigContext) return;

  sigContext.strokeStyle = '#1f2937';
  sigContext.lineWidth = 2;
  sigContext.lineCap = 'round';
  sigContext.lineJoin = 'round';

  // Draw clear instructions
  sigContext.fillStyle = '#9ca3af';
  sigContext.font = '14px sans-serif';
  sigContext.textAlign = 'center';
  sigContext.fillText('Sign here', canvas.width / 2, canvas.height / 2);

  // Mouse events
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  // Touch events
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(getTouchPos(e)); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(getTouchPos(e)); });
  canvas.addEventListener('touchend', (e) => { e.preventDefault(); endDraw(); });
}

function getTouchPos(e: TouchEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  if (!touch) return null;
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function startDraw(pos?: { x: number; y: number }) {
  if (!sigContext || !canvasRef.value) return;
  isDrawing.value = true;
  sigPoints = [];
  sigContext.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

  if (pos) {
    sigContext.beginPath();
    sigContext.moveTo(pos.x, pos.y);
    sigPoints.push(pos);
  }
}

function draw(pos?: { x: number; y: number }) {
  if (!isDrawing.value || !sigContext || !pos) return;
  sigContext.lineTo(pos.x, pos.y);
  sigContext.stroke();
  sigPoints.push(pos);
}

function endDraw() {
  isDrawing.value = false;
  if (sigPoints.length > 1 && canvasRef.value) {
    signatureDataUrl.value = canvasRef.value.toDataURL('image/png');
  }
}

function clearSignature() {
  if (!sigContext || !canvasRef.value) return;
  sigContext.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  sigPoints = [];
  signatureDataUrl.value = null;

  sigContext.fillStyle = '#9ca3af';
  sigContext.font = '14px sans-serif';
  sigContext.textAlign = 'center';
  sigContext.fillText('Sign here', canvasRef.value.width / 2, canvasRef.value.height / 2);
}

// Submit receipt
async function confirmReceipt() {
  if (!selectedDelivery.value) return;
  isSubmitting.value = true;
  receiptError.value = '';

  try {
    await typedMutation(props.client, 'deliveries:confirmReceipt', {
      deliveryId: selectedDelivery.value._id,
      receiptPhoto: capturedPhoto.value || undefined,
      signature: signatureDataUrl.value || undefined,
    });
    closeReceipt();
  } catch (err) {
    receiptError.value = (err as Error).message;
  } finally {
    isSubmitting.value = false;
  }
}

// --- Helpers ---
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(id: string): string {
  return id.substring(0, 2).toUpperCase();
}

// Watch for deliveryId prop to open receipt modal for selected delivery
watch(() => props.deliveryId, (newId) => {
  if (newId) {
    const delivery = deliveries.value.find(d => d._id === newId);
    if (delivery && delivery.status === 'on_site') {
      openReceipt(delivery);
    }
  }
});

// Watch deliveries for changes and re-init trucks
watch(inTransitDeliveries, () => {
  if (mapInstance) {
    initTruckPositions();
    updateMarkers();
  }
}, { deep: true });

onMounted(() => {
  initTruckPositions();
  nextTick(() => {
    initMap();
  });
});

onUnmounted(() => {
  destroyMap();
});
</script>

<template>
  <div class="delivery-tracker">
    <!-- Tabs -->
    <div class="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <button
        v-for="tab in ([
          { id: 'all', label: 'All', count: deliveries.length },
          { id: 'ordered', label: 'Ordered', count: deliveries.filter(d => d.status === 'ordered' || d.status === 'dispatched').length },
          { id: 'in_transit', label: 'In Transit', count: deliveries.filter(d => d.status === 'in_transit').length },
          { id: 'on_site', label: 'On Site', count: deliveries.filter(d => d.status === 'on_site').length },
          { id: 'received', label: 'Received', count: deliveries.filter(d => d.status === 'received_inspected').length }
        ] as const)"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
        :class="activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
      >
        {{ tab.label }}
        <span class="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs"
          :class="activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
        >
          {{ tab.count }}
        </span>
        <span v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="skeleton h-16 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredDeliveries.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
      <svg class="mb-2 h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      <p class="text-sm font-medium">No deliveries found</p>
      <p class="text-xs mt-1">No deliveries match the current filter.</p>
    </div>

    <!-- Delivery list -->
    <div v-else class="space-y-2">
      <div
        v-for="delivery in filteredDeliveries"
        :key="delivery._id"
        class="rounded-lg border border-gray-200 p-4 transition-colors dark:border-gray-700"
        :class="{
          'hover:bg-gray-50 dark:hover:bg-gray-800/50': true,
          'ring-2 ring-blue-400 dark:ring-blue-600': props.deliveryId === delivery._id,
        }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ delivery.title }}</p>
              <!-- Progress dot -->
              <span class="h-2 w-2 rounded-full" :class="{
                'bg-gray-400': delivery.status === 'ordered',
                'bg-blue-500': delivery.status === 'dispatched',
                'bg-yellow-500': delivery.status === 'in_transit',
                'bg-purple-500': delivery.status === 'on_site',
                'bg-green-500': delivery.status === 'received_inspected',
              }" />
            </div>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ delivery.supplier }} &middot; ETA {{ formatDate(delivery.eta) }}
            </p>
            <div class="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span v-if="delivery.materialList?.length" class="flex items-center gap-1">
                📦 {{ delivery.materialList.length }} material(s)
              </span>
              <span v-if="delivery.actualArrival">
                ✅ Arrived {{ formatDateTime(delivery.actualArrival) }}
              </span>
            </div>

            <!-- Progress bar -->
            <div class="mt-2 h-1.5 w-full max-w-xs rounded-full bg-gray-200 dark:bg-gray-700">
              <div class="h-1.5 rounded-full transition-all duration-500" :class="{
                'bg-gray-400': delivery.status === 'ordered',
                'bg-blue-500': delivery.status === 'dispatched',
                'bg-yellow-500': delivery.status === 'in_transit',
                'bg-purple-500': delivery.status === 'on_site',
                'bg-green-500': delivery.status === 'received_inspected',
              }" :style="{ width: statusProgress[delivery.status] + '%' }" />
            </div>
          </div>

          <div class="flex flex-col items-end gap-2 shrink-0">
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="statusColors[delivery.status]">
              {{ statusLabels[delivery.status] }}
            </span>
            <!-- Confirm receipt button for on_site deliveries -->
            <button
              v-if="delivery.status === 'on_site'"
              @click="openReceipt(delivery)"
              class="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Confirm Receipt
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Section -->
    <div class="mt-4">
      <div class="mb-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Live Tracking Map</span>
        </div>
        <span class="text-xs text-gray-400">{{ inTransitDeliveries.length }} vehicle(s) in transit</span>
      </div>
      <div ref="mapContainer" class="h-64 w-full rounded-lg border border-gray-200 dark:border-gray-700 z-0" />
    </div>

    <!-- Receipt Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showReceiptModal && selectedDelivery"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeReceipt">
        <div class="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <!-- Modal header -->
          <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <div>
              <h3 class="text-lg font-semibold">Confirm Receipt</h3>
              <p class="text-sm text-gray-500">{{ selectedDelivery.title }} - {{ selectedDelivery.supplier }}</p>
            </div>
            <button @click="closeReceipt"
              class="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-5 p-5">
            <!-- Photo capture -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Photo</label>
              <div class="flex items-center gap-3">
                <button @click="capturePhoto" :disabled="photoUploading"
                  class="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
                  :class="{ 'opacity-50': photoUploading }">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                  </svg>
                  {{ photoUploading ? 'Capturing...' : capturedPhoto ? 'Retake Photo' : 'Take Photo' }}
                </button>
              </div>

              <!-- Photo preview -->
              <div v-if="capturedPhoto" class="mt-2">
                <img :src="capturedPhoto" alt="Delivery photo" class="h-32 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
              </div>
            </div>

            <!-- Signature pad -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Signature</label>
              <div class="relative rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden" style="touch-action: none;">
                <canvas ref="canvasRef" class="w-full cursor-crosshair" style="height: 160px; min-height: 160px;" />
              </div>
              <button v-if="signatureDataUrl" @click="clearSignature"
                class="mt-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Clear signature
              </button>
              <div v-if="signatureDataUrl" class="mt-2">
                <img :src="signatureDataUrl" alt="Signature preview" class="h-12 rounded border border-gray-200 dark:border-gray-700" />
              </div>
            </div>

            <!-- Error -->
            <p v-if="receiptError" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
              {{ receiptError }}
            </p>

            <!-- Delivery summary -->
            <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Delivery Summary</p>
              <div class="mt-1 space-y-1 text-sm">
                <p><span class="text-gray-500">Title:</span> {{ selectedDelivery.title }}</p>
                <p><span class="text-gray-500">Supplier:</span> {{ selectedDelivery.supplier }}</p>
                <p><span class="text-gray-500">ETA:</span> {{ formatDate(selectedDelivery.eta) }}</p>
                <p v-if="selectedDelivery.materialList?.length">
                  <span class="text-gray-500">Materials:</span>
                  <span v-for="(mat, idx) in selectedDelivery.materialList" :key="idx" class="ml-1">
                    {{ mat.quantity }}× {{ mat.name }}{{ idx < (selectedDelivery.materialList?.length || 0) - 1 ? ',' : '' }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Footer buttons -->
          <div class="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button @click="closeReceipt"
              class="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button @click="confirmReceipt" :disabled="isSubmitting"
              class="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <svg v-if="isSubmitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ isSubmitting ? 'Confirming...' : 'Confirm Receipt' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

:deep(.truck-marker) {
  background: none !important;
  border: none !important;
}

:deep(.onsite-marker) {
  background: none !important;
  border: none !important;
}
</style>
