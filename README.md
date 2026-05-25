<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://via.placeholder.com/1200x60/1a1a2e/ffffff?text=SiteSync+Pro">
  <img alt="SiteSync Pro" src="https://via.placeholder.com/1200x60/2563eb/ffffff?text=SiteSync+Pro">
</picture>

# SiteSync Pro — Real-Time Construction Project Management

[![CI/CD](https://github.com/dev-lou/SiteSync/actions/workflows/ci.yml/badge.svg)](https://github.com/dev-lou/SiteSync/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-5-ff3e00)](https://kit.svelte.dev/)
[![Vue](https://img.shields.io/badge/Vue-3-4fc08d)](https://vuejs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.39-ff6b35)](https://convex.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security: Trivy](https://img.shields.io/badge/Security-Trivy-blueviolet)](https://trivy.dev/)
[![K8s: K3s](https://img.shields.io/badge/K8s-K3s-326ce5)](https://k3s.io/)

> A **production-grade, real-time construction management platform** where office teams set project states and field engineers see changes instantly — via Convex's WebSocket-powered real-time sync. Built with a modern monorepo architecture combining SvelteKit 5 (shell, routing, SSR) with Vue 3 micro-frontends (rich interactive widgets), all backed by a real-time Convex backend with role-based access control.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [5 Core Modules](#-5-core-modules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)
- [Real-Time Architecture](#real-time-architecture)
- [Vue Widget Architecture](#vue-widget-architecture)
- [Design System](#design-system)
- [Authentication & Security](#authentication--security)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Monitoring & Observability](#monitoring--observability)
- [CI/CD Pipeline](#cicd-pipeline)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**SiteSync Pro** solves a real problem in construction: **information lag between office and field**. When a procurement officer updates a delivery ETA, an architect approves a blueprint revision, or an HSE officer suspends a zone — field engineers see those changes instantly without refreshing their browser.

### Target Users

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access, user management, all projects |
| **Project Manager** | Cross-module oversight, board configuration, reports |
| **Procurement Officer** | Delivery tracking, material ordering, supplier management |
| **Architect / Design Engineer** | Blueprint uploads, revision management, inspection checklist creation |
| **Field Engineer** | Daily execution: start inspections, confirm deliveries, move tasks |
| **HSE Officer** | Safety permits, zone management, compliance monitoring |

### Key Differentiators

- **Real-time by default** — Every state change propagates instantly via WebSocket. No polling, no page refreshes.
- **Modular widget architecture** — Each interactive module is a standalone Vue 3 library, independently built and versioned, loaded dynamically into the SvelteKit shell.
- **Cross-module integrations** — Zone suspension automatically blocks linked Kanban tasks. Kanban cards link to deliveries, inspections, and blueprints.
- **Field-ready** — PWA support with offline fallback, mobile-responsive layout with bottom navigation, camera capture for inspection photos and delivery receipts.
- **Zero-ops backend** — Convex handles database, real-time sync, file storage, scheduled jobs, and serverless function hosting.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Browser (Client)                           │
├─────────────────────────┬────────────────────────────────────────────┤
│    SvelteKit 5 Shell    │         Vue 3 Widgets (Micro-Frontends)     │
│                         │                                              │
│  ┌──────────────────┐   │  ┌──────────────┐  ┌──────────────────┐    │
│  │  +layout.svelte  │   │  │  Delivery     │  │  Inspection      │    │
│  │  Sidebar + Header│   │  │  Tracker      │  │  Form            │    │
│  │  + ToastContainer│   │  └──────────────┘  └──────────────────┘    │
│  ├──────────────────┤   │  ┌──────────────┐  ┌──────────────────┐    │
│  │  Route Pages:    │   │  │  Blueprint    │  │  Safety          │    │
│  │  /app/deliveries │   │  │  Viewer       │  │  Heatmap         │    │
│  │  /app/inspections│   │  └──────────────┘  └──────────────────┘    │
│  │  /app/blueprints │   │  ┌──────────────┐                           │
│  │  /app/safety     │   │  │  Kanban       │                           │
│  │  /app/my-tasks   │   │  │  Board        │                           │
│  │  /app/reports    │   │  └──────────────┘                           │
│  │  /app/users      │   │                                              │
│  │  /app/settings   │   │                                              │
│  └──────────────────┘   └─────────────────────────────────────────────┤
├─────────────────────────┬────────────────────────────────────────────┤
│  Svelte `useConvexQuery`│     Vue `useConvexQuery` composable          │
│  (svelte/store)         │     (vue ref + onUnmounted)                 │
└─────────────────────────┴─────────────────────────────────────────────┤
│                    Convex JS Client (WebSocket)                        │
├───────────────────────────────────────────────────────────────────────┤
│                     Convex Backend (Cloud)                             │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Deliveries│  │Inspections│  │Blueprints│  │  Safety  │  │ Kanban │ │
│  │Q:5 M:5   │  │Q:4 M:4   │  │Q:5 M:4 A:2│  │Q:6 M:6  │  │Q:6 M:5 │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Middleware: requireAuth → requireRole → validateStatusTransition│ │
│  │  Auth: Better Auth (magic link)                                 │ │
│  │  Scheduled: expirePermits (hourly), generateDailyLogs (24h)     │ │
│  │  DB: 13 tables, 40+ indexes, validator-enforced schemas         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → SvelteKit page or Vue widget triggers a Convex mutation
2. **Mutation Execution** → Convex Cloud validates the mutation (auth middleware → role check → status transition rules) → writes to database
3. **Real-Time Broadcast** → Convex pushes the change to all connected clients subscribed to relevant queries
4. **Reactive Update** → Svelte stores / Vue refs update → components re-render instantly
5. **Cross-Module Side Effects** — Some mutations trigger additional effects (e.g., `suspendZone` blocks linked Kanban cards)

### Convex Backend Architecture

```
convex/
├── schema.ts          # 13 tables with 40+ indexes and validator-enforced schemas
├── auth.ts            # Better Auth setup (magic link provider)
├── auth.config.ts     # Auth config for Convex deployment
├── http.ts            # HTTP route registration (auth routes + /health)
├── convex.config.ts   # App definition with auth component
├── crons.ts           # Scheduled job registration
└── functions/
    ├── middleware.ts   # requireAuth, requireRole, validateStatusTransition
    ├── deliveries/     # 5 queries, 5 mutations
    ├── inspections/    # 4 queries, 4 mutations
    ├── blueprints/     # 5 queries, 4 mutations, 2 actions
    ├── permits/        # 6 queries, 6 mutations, 1 scheduled
    ├── kanban/         # 6 queries, 5 mutations
    ├── projects/       # 4 queries, 3 mutations
    ├── users/          # 4 queries, 3 mutations
    ├── notifications/  # 2 queries, 5 mutations
    ├── dailyLogs/      # 1 scheduled
    └── ai/             # 2 actions (photo analysis, task suggestions)
```

---

## 📦 5 Core Modules

### 1. Delivery Tracker

Track materials from order to site receipt in real-time.

| Feature | Implementation |
|---------|---------------|
| **Status workflow** | `ordered → dispatched → in_transit → on_site → received_inspected` with validated state transitions |
| **Interactive map** | Leaflet with OpenStreetMap — truck markers with heading rotation, simulated GPS movement |
| **Receipt confirmation** | Camera capture (mobile `capture="environment"`), canvas-based signature pad (mouse + touch), mutation-backed confirmation |
| **Filter tabs** | All / Ordered / In Transit / On Site / Received with count badges |
| **Real-time updates** | ETA changes, status transitions, receipt confirmations push instantly to all viewers |

**Status: Complete** ✅

### 2. Inspections & QA

Digital checklist workflow with full audit trail.

| Feature | Implementation |
|---------|---------------|
| **Checklist management** | Pass/fail toggle per item, required items marked with asterisk |
| **Notes & photos** | Debounced notes (500ms), camera capture stored as data URLs in checklist item |
| **Progress tracking** | Real-time progress bar with percentage and item count |
| **Audit trail** | Timestamped action log with user initials, action description, and detail |
| **Completion flow** | Three outcome options: Passed / Remedial / Failed with commit summary |
| **PDF generation** | Server-side endpoint (`/api/inspection-summary/[projectId]`) via `pdf-lib` |

**Status: Complete** ✅

### 3. Blueprint Viewer

Version-controlled drawing management with deep-zoom viewing.

| Feature | Implementation |
|---------|---------------|
| **Deep-zoom viewer** | OpenSeadragon — free, open-source, supports gigapixel images |
| **Revision history** | Versioned revisions with change logs, revision selector dropdown |
| **Status workflow** | `draft → in_review → approved → for_construction` |
| **Zoom controls** | In/out/reset/fullscreen with zoom level display |
| **Navigator panel** | OpenSeadragon built-in minimap for orientation |
| **Change orders** | Linked change order management with approve/reject workflow |

**Backend actions:** `convertPdfToPages` (PDF-to-image via `pdfjs-dist`) and `autoTagInspectionPhoto` (Gemini AI for photo defect detection).

**Status: Complete** ✅

### 4. Safety Heatmap & Permits

Zone-based safety management with visual floor plan.

| Feature | Implementation |
|---------|---------------|
| **SVG floor plan** | Zone paths rendered as SVG with color-coded fill (green=active, red=suspended, gray=completed) |
| **Interactive zones** | Click to view permits, hover for tooltip with zone info |
| **Permit management** | 5 permit types (hot work, confined space, height work, electrical, general) with expiring-warning indicators |
| **Auto-expiry** | Hourly cron job expires permits, broadcasts changes |
| **Cross-module blocking** | Zone suspension automatically moves linked Kanban cards to "blocked" with the suspension reason |

**Status: Complete** ✅

### 5. Kanban Board

Drag-and-drop project task board with real-time sync.

| Feature | Implementation |
|---------|---------------|
| **6 default columns** | Backlog → Ready → In Progress → QC → Done → Blocked |
| **Drag & drop** | Native HTML5 drag-and-drop with Vue TransitionGroup animations |
| **Priorities** | 4 levels (low/medium/high/critical) with color-coded badges |
| **Cross-linking** | Cards can link to deliveries, inspections, and blueprints |
| **My Tasks filter** | Toggle to show only cards assigned to current user |
| **Daily logs** | 24h scheduled job generates per-project daily summaries of task movements, deliveries received, and inspections completed |

**Status: Complete** ✅

### Bonus: Reports & Analytics

- **Chart.js dashboard** — Bar charts for overview counts, KPI summary cards, status breakdowns
- **Export** — Print-ready report layout

### Bonus: AI Features

- **`analyzeInspectionPhoto`** — Gemini Vision API integration for photo defect detection. Graceful fallback to rule-based analysis when API key is absent.
- **`generateTaskSuggestions`** — Analyzes inspection results and generates smart task suggestions with priority and role assignment.

---

## Tech Stack

### Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| **SvelteKit** | 5 + Svelte 5 | SSR, routing, layouts, server endpoints, data loading |
| **Vue 3** | ^3.5 | Rich interactive widgets (micro-frontends) |
| **Convex** | ^1.39 | Backend: database, real-time sync, file storage, scheduled jobs, serverless functions |
| **TypeScript** | ^5.8 | Strict mode, full type safety across the monorepo |
| **pnpm** | ^10 | Monorepo workspace management with content-addressable storage |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Tailwind CSS v4** | Utility-first styling with `@theme inline` design tokens |
| **shadcn-svelte** (bits-ui) | Accessible UI primitives (Button, Card, Modal, DataTable, etc.) |
| **Lucide** | Consistent icon library |
| **mode-watcher** | Dark mode class-based toggling |
| **clsx + tailwind-merge** | Conditional class merging utility |
| **Leaflet + OpenStreetMap** | Free map rendering (no API key required) |
| **OpenSeadragon** | Deep-zoom image viewer for blueprints |
| **Chart.js** | Analytics dashboard charts |
| **Inter (Google Fonts)** | System font — modern, highly readable |

### Backend (Convex)

| Capability | Implementation |
|-----------|---------------|
| **Database** | 13 tables with schema validation via `convex/values` validators |
| **Real-time** | `onUpdate()` subscriptions — push-based, no polling |
| **Auth** | Better Auth with magic link + 6 user roles |
| **File storage** | Convex `storage.store()` for blueprint files and inspection photos |
| **Scheduled jobs** | Cron-based hourly/daily job execution |
| **Serverless functions** | Queries, mutations, and actions — auto-scaling |

### DevOps

| Technology | Purpose |
|-----------|---------|
| **Docker** | Multi-stage production build (deps → builder → runner) |
| **K3s** | Lightweight Kubernetes for deployment |
| **ArgoCD** | GitOps deployment with automated sync |
| **Terraform (OCI)** | Oracle Cloud free tier infrastructure provisioning |
| **Prometheus** | Metrics collection from `/metrics` endpoint |
| **Grafana** | Pre-configured dashboards + alerting |
| **GitHub Actions** | CI/CD with parallel builds, security scanning, SBOM generation |
| **Trivy** | Vulnerability scanning (filesystem + container image) |
| **CodeQL** | Code quality and security analysis |

---

## Project Structure

```
sitesync-pro/
│
├── apps/
│   └── sveltekit/                          # SvelteKit 5 frontend shell
│       ├── src/
│       │   ├── app.html                    # PWA-enabled HTML shell
│       │   ├── app.css                     # Tailwind v4 + design tokens (oklch)
│       │   ├── hooks.server.ts             # Auth guard (Better Auth session check)
│       │   ├── service-worker.ts           # PWA service worker (cache-first + offline)
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   ├── ui/                 # 13 reusable components (Button, Card, Modal, etc.)
│       │   │   │   ├── layout/             # Sidebar, Header, BottomNav
│       │   │   │   └── widgets/            # DeliveryTrackerWrapper, WidgetWrapper
│       │   │   ├── stores/                 # theme.ts, toast.ts, convex.ts, notifications.ts, command-palette.ts
│       │   │   ├── utils/                  # cn.ts, widget-loader.ts, convex-types.ts (typed helpers)
│       │   │   └── design/                 # tokens.ts (shared design token constants)
│       │   └── routes/
│       │       ├── +layout.svelte          # Root layout
│       │       ├── +page.svelte            # Landing page
│       │       ├── login/+page.svelte      # Magic link login
│       │       ├── app/                    # Authenticated routes
│       │       │   ├── +layout.svelte      # Sidebar + Header + BottomNav + ToastContainer
│       │       │   ├── +layout.server.ts   # Auth guard + user data loading
│       │       │   ├── +page.svelte        # Dashboard
│       │       │   ├── deliveries/         # Delivery Tracker page
│       │       │   ├── inspections/        # Inspections page (with InspectionForm widget)
│       │       │   ├── blueprints/         # Blueprint page (with BlueprintViewer widget)
│       │       │   ├── safety/             # Safety page (with SafetyHeatmap widget)
│       │       │   ├── my-tasks/           # Kanban page (with KanbanBoard widget)
│       │       │   ├── reports/            # Chart.js analytics dashboard
│       │       │   ├── users/              # User management (admin only)
│       │       │   └── settings/           # Profile, theme, notification preferences
│       │       ├── api/inspection-summary/ # PDF generation endpoint
│       │       └── metrics/               # Prometheus metrics endpoint
│       ├── static/
│       │   └── manifest.json               # PWA manifest
│       ├── svelte.config.js                # SvelteKit config (adapter-node, aliases)
│       ├── vite.config.ts                  # Vite config (Tailwind, SSR externals)
│       └── package.json
│
├── widgets/                                # Vue 3 micro-frontends (separate Vite lib builds)
│   ├── delivery-tracker/                   # DeliveryTrackerWidget.vue — Leaflet map, receipt modal
│   ├── inspection-form/                    # InspectionFormWidget.vue — checklist, audit trail
│   ├── blueprint-viewer/                   # BlueprintViewerWidget.vue — OpenSeadragon
│   ├── safety-heatmap/                     # SafetyHeatmapWidget.vue — SVG floor plan
│   └── kanban-board/                       # KanbanBoardWidget.vue — drag-and-drop
│
├── packages/                               # Shared libraries
│   ├── convex-vue-client/                  # Vue composables wrapping Convex JS client
│   │   └── src/
│   │       ├── index.ts                    # getConvexClient, useConvexQuery, useMutation
│   │       └── convex-types.ts             # Type-safe typedMutation/typedQuery helpers
│   └── design-tokens/                      # Shared design token constants
│       └── src/
│           ├── tokens.ts                   # colors, typography, spacing, radii, roleLabels
│           └── tokens.test.ts              # Vitest smoke tests
│
├── convex/                                 # Convex backend
│   ├── schema.ts                           # 13 tables, 40+ indexes
│   ├── auth.ts / auth.config.ts            # Better Auth setup
│   ├── http.ts / convex.config.ts          # HTTP routes + app config
│   ├── crons.ts                            # Scheduled job registrations
│   └── functions/                          # Queries, mutations, actions, middleware
│       ├── middleware.ts                   # requireAuth, requireRole, validateStatusTransition
│       ├── deliveries/                     # 5 queries, 5 mutations
│       ├── inspections/                    # 4 queries, 4 mutations
│       ├── blueprints/                     # 5 queries, 4 mutations, 2 actions
│       ├── permits/                        # 6 queries, 6 mutations, 1 scheduled
│       ├── kanban/                         # 6 queries, 5 mutations
│       ├── projects/                       # 4 queries, 3 mutations
│       ├── users/                          # 4 queries, 3 mutations
│       ├── notifications/                  # 2 queries, 5 mutations
│       ├── dailyLogs/                      # 1 scheduled
│       └── ai/                             # 2 actions (photo analysis, task suggestions)
│
├── docker/                                 # Docker Compose monitoring stack
│   ├── prometheus/                         # prometheus.yml with SvelteKit scrape config
│   └── grafana/                            # Provisioned dashboards + datasources + alerting
│
├── kubernetes/                             # K3s deployment manifests
│   ├── deployment.yaml                     # Deployment, Service, Ingress, HPA, PDB, NetworkPolicy, RBAC
│   └── argocd-application.yaml            # ArgoCD Application with auto-sync
│
├── terraform/                              # Oracle Cloud free tier IaC
│   ├── main.tf                             # VCN, compute (VM.Standard.A1.Flex), security
│   └── cloud-init.yaml                     # K3s + ArgoCD auto-install
│
├── .github/workflows/ci.yml                # CI/CD pipeline
├── package.json                            # Root scripts (build:all, test, lint, etc.)
├── pnpm-workspace.yaml                     # Workspace config (apps/*, widgets/*, packages/*, convex)
├── DESIGN_SYSTEM.md                        # Complete design system documentation
├── docker-compose.yml                      # Local dev with Prometheus + Grafana
├── Dockerfile                              # Multi-stage production build
└── todo.md                                 # Full implementation plan and status
```

---

## Getting Started

### Prerequisites

- **Node.js** 22+ (LTS recommended)
- **pnpm** 10+ (`npm install -g pnpm@10`)
- **Git** 2.40+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dev-lou/SiteSync.git
cd sitesync-pro

# Install all dependencies
pnpm install

# Generate Convex client types (requires Convex account)
cd convex
npx convex dev
cd ..

# Start the development server
pnpm dev
```

The app will be available at **http://localhost:3000**.

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required — Convex deployment URL (get from Convex dashboard)
CONVEX_URL=https://your-project.convex.cloud

# Required — Better Auth encryption secret (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET=your-secret-key-here

# Required — Application URL (used by auth for redirects)
BETTER_AUTH_URL=http://localhost:3000

# Optional — Gemini AI API key (for image analysis features)
GEMINI_API_KEY=your-gemini-api-key
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start SvelteKit dev server on port 3000 |
| `pnpm build` | Build SvelteKit for production |
| `pnpm build:widgets` | Build all 5 Vue widget libraries |
| `pnpm build:all` | Build widgets + SvelteKit (full production build) |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run Prettier check on SvelteKit |
| `pnpm check` | Run svelte-check (type + lint validation) |
| `pnpm test` | Run Vitest smoke tests (design-tokens) |
| `pnpm format` | Format all files with Prettier |

---

## Development Guide

### Adding a New Page

1. Create a new route in `apps/sveltekit/src/routes/app/`:
   ```bash
   mkdir apps/sveltekit/src/routes/app/new-page
   touch apps/sveltekit/src/routes/app/new-page/+page.svelte
   ```
2. Add the route to `Sidebar.svelte` nav items (role-filtered)
3. If the page needs server-side data, add `+page.server.ts` or `+layout.server.ts`
4. For real-time data, use `useConvexQuery` from `$stores/convex-query`

### Adding a Convex Query/Mutation

1. Define or update the schema in `convex/schema.ts`
2. Add the function in the appropriate `convex/functions/<module>/` directory:
   - Queries: `queries.ts`
   - Mutations: `mutations.ts`
   - Actions: `actions.ts`
   - Scheduled: `scheduled.ts`
3. Update the type maps in both:
   - `apps/sveltekit/src/lib/utils/convex-types.ts` (SvelteKit)
   - `packages/convex-vue-client/src/convex-types.ts` (Vue widgets)
4. Use the typed helpers: `mutation(name, args)` or `typedMutation(client, name, args)`

### Adding a New Vue Widget

1. Create the widget package:
   ```bash
   mkdir -p widgets/new-widget/src
   cd widgets/new-widget
   # Initialize package.json following the existing widget pattern
   ```
2. Create `src/WidgetComponent.vue` with the widget logic
3. Create `src/index.ts` with mount/unmount exports
4. Create `vite.config.ts` following the library build pattern
5. Add the workspace dependency to `apps/sveltekit/package.json`
6. Create a Svelte wrapper component in `apps/sveltekit/src/lib/components/widgets/`
7. Update `vite.config.ts` in SvelteKit to externalize the widget in SSR

### Code Quality Standards

- **Type safety**: No `as any` casts in production code (use typed helpers from `convex-types.ts`)
- **State management**: Svelte 5 runes (`$state`, `$derived`, `$props`) — no legacy stores in components
- **Component patterns**: Follow shadcn-svelte conventions for UI components
- **Convex functions**: Every mutation must use `requireAuth` + appropriate `requireRole` middleware
- **Real-time subscriptions**: Use `onUpdate` (Convex) or `useConvexQuery` (Svelte store) / `useConvexQuery` (Vue composable) — no polling

---

## Real-Time Architecture

### How Real-Time Works

1. **Convex `onUpdate`** — Both the Svelte `useConvexQuery` store and the Vue `useConvexQuery` composable call `client.onUpdate(queryName, args, callback)`, which opens a WebSocket subscription to the Convex backend.

2. **WebSocket multiplexing** — The Convex JS client maintains a single WebSocket connection per tab and multiplexes all query subscriptions over it. This means a page with 5 active queries uses one connection.

3. **Push-based updates** — When a mutation writes to the database, Convex reevaluates all active queries and pushes deltas to subscribers. No polling, no manual refresh.

4. **Automatic cleanup** — Svelte stores clean up subscriptions on component destroy via the custom subscribe function. Vue composables clean up via `onUnmounted`.

### Connection Architecture

```
Tab 1                          Tab 2                          Tab N
  │                              │                              │
  ├─ ConvexClient ─── WebSocket ─┤                              │
  │  ├─ onUpdate('deliveries:',..)│                              │
  │  ├─ onUpdate('inspections:',.)│                              │
  │  └─ ...                       │                              │
  │                               ├─ ConvexClient ─── WebSocket ─┤
  │                               │  ├─ onUpdate('deliveries:',.)│
  │                               │  └─ ...                      │
  │                               │                              │
  └─────────── Convex Cloud ──────┴───────────────────────────────┘
                        │
                  ┌──────┴──────┐
                  │   Database   │
                  │  (13 tables) │
                  └──────────────┘
```

---

## Vue Widget Architecture

### Why Vue inside SvelteKit?

The 5 interactive widgets (Delivery Tracker, Inspection Form, Blueprint Viewer, Safety Heatmap, Kanban Board) are built as **standalone Vue 3 libraries**. This architectural choice was deliberate:

1. **Independent development** — Each widget can be developed, tested, and versioned independently
2. **CDN-deployable** — Widgets could be hosted on a CDN and loaded at runtime (future)
3. **Rich ecosystem** — Vue's composable system and template syntax are well-suited for these complex interactive UIs
4. **Separation of concerns** — The SvelteKit shell handles routing, SSR, and layout; Vue handles widget interactivity

### How Widget Mounting Works

```
SvelteKit Page (e.g., /app/deliveries)
  │
  ├── DeliveryTrackerWrapper.svelte
  │     │
  │     └── onMount() → dynamic import('@sitesync/delivery-tracker')
  │           │
  │           └── mountDeliveryTracker(container, { convexUrl, projectId, userId, userRole })
  │                 │
  │                 ├── Creates Vue app instance
  │                 ├── Creates ConvexClient (singleton)
  │                 └── Mounts Vue component into container div
  │
  └── WidgetWrapper.svelte (generic fallback)
```

### Mount/Unmount Pattern

Each widget package exports mount/unmount functions from its `index.ts`:

```typescript
// widgets/delivery-tracker/src/index.ts
import { createApp } from 'vue';
import DeliveryTrackerWidget from './DeliveryTrackerWidget.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountDeliveryTracker(
  container: HTMLElement,
  props: { convexUrl: string; projectId: string; userId: string; userRole: string; deliveryId?: string }
) {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(DeliveryTrackerWidget, { ...props, client });
  const instance = app.mount(container);
  return () => { app.unmount(); };
}
```

### Shared Convex Client Package

`@sitesync/convex-vue-client` provides:

| Export | Description |
|--------|-------------|
| `getConvexClient(url)` | Singleton ConvexClient factory |
| `useConvexQuery(client, name, args)` | Reactive query subscription (auto-unsubscribe on unmount). Accepts both `FunctionReference` (typed) and `string` (for widgets). |
| `useMutation(client, name)` | Typed mutation wrapper |
| `useOptimisticMutation(client, name)` | Mutation with optimistic update support |
| `typedMutation(client, name, args)` | Type-safe mutation with args validation |
| `typedQuery(client, name, args, callback)` | Type-safe query subscription |
| `ConvexMutation` / `ConvexQuery` | Union type of all known mutation/query names |
| `MutationArgs` / `QueryArgs` | Args type map for all mutations/queries |

---

## Design System

A comprehensive **DESIGN_SYSTEM.md** is maintained separately. Key highlights:

### Color System

- **Color space**: `oklch()` for perceptual uniformity across light and dark modes
- **19 semantic tokens**: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--danger`, etc.
- **Dark mode**: `.dark` class on `<html>` toggled via `mode-watcher`. Separate token values but same hue/chroma for consistency.

### Typography

- **Font**: Inter (Google Fonts) — loaded via `@import`
- **Scale**: Major Third (1.25) — 9 steps from `xs` (0.75rem) to `5xl` (3rem)
- **Weights**: 400 (body), 500 (buttons), 600 (subheadings), 700 (headings)

### Component Library

13 reusable UI components in `apps/sveltekit/src/lib/components/ui/`:

Button, Card, Input, Select, Badge, Skeleton, Modal, Toast, ToastContainer, Avatar, Tooltip, Tabs, DataTable

All follow shadcn-svelte conventions with consistent variants, sizes, and accessibility.

### Spacing & Layout

- **Base unit**: 0.25rem (4px)
- **Grid**: 13 steps (0–24), linear scale
- **Layout**: Content max-width 1200px, Sidebar 240px (expanded) / 64px (collapsed)
- **Breakpoints**: Tailwind default — responsive BottomNav at `md:` breakpoint (768px)

---

## Authentication & Security

### Auth Flow

```
User → /login → enters email → magic link sent → clicks link → session created → redirects to /app
```

- **Provider**: Better Auth with magic link (passwordless)
- **Session**: HTTP-only cookie managed by Better Auth
- **Route protection**: `hooks.server.ts` checks session on every request, redirects to `/login` if unauthenticated

### Role-Based Access Control (6 Roles)

| Role | Abbreviation | Access |
|------|-------------|--------|
| `admin` | ADMIN | Full system access, user management |
| `project_manager` | PM | Cross-module oversight, board config |
| `procurement` | PROC | Delivery management, material ordering |
| `architect` | ARCH | Blueprint uploads, inspection checklists |
| `field_engineer` | FE | Daily execution tasks |
| `hse_officer` | HSE | Safety permits, zone management |

### Backend Security Middleware

Every Convex mutation is protected by a middleware chain:

```
ctx → requireAuth() → requireRole([...]) → validateStatusTransition() → handler
```

- **`requireAuth()`** — Verifies `ctx.auth.getUserIdentity()` exists, throws `Unauthenticated` if not
- **`requireRole(allowedRoles)`** — Looks up user in DB, checks `role` field against allowed list, throws `Unauthorized` if not
- **`validateStatusTransition(from, to)`** — Enforces valid state transitions (e.g., `ordered → dispatched` is valid, but `ordered → received_inspected` is not)

### Security Features

- **CSP headers** — Set in SvelteKit server hooks
- **Input validation** — Convex schema validators on all tables
- **HSTS** — Enforced in production
- **Rate limiting** — Via Convex's built-in request queuing
- **XSS prevention** — Svelte's automatic HTML escaping
- **Dependency scanning** — Trivy + CodeQL in CI pipeline
- **SBOM generation** — CycloneDX format in every CI build

---

## API Reference

### Query Functions

Each query is available via `client.onUpdate(queryName, args, callback)`.

| Module | Query | Args | Purpose |
|--------|-------|------|---------|
| **Deliveries** | `listByProject` | `{ projectId }` | All deliveries for a project |
| | `getById` | `{ deliveryId }` | Single delivery with full details |
| | `listByStatus` | `{ projectId, status }` | Filtered delivery list |
| | `getActiveDeliveries` | `{ projectId }` | Non-received deliveries sorted by urgency |
| | `getDeliveryCounts` | `{ projectId }` | Aggregated counts (active, inTransit, received) |
| **Inspections** | `listByProject` | `{ projectId }` | All inspections |
| | `getById` | `{ inspectionId }` | Single inspection with checklist + audit trail |
| | `listByAssignee` | `{ assigneeId }` | Inspections assigned to user |
| | `getCounts` | `{ projectId }` | Aggregated counts (pending, passed, failed) |
| **Blueprints** | `listByProject` | `{ projectId }` | All blueprints |
| | `getById` | `{ blueprintId }` | Single blueprint with latest revision |
| | `getRevisions` | `{ blueprintId }` | Revision history |
| | `getLatestRevision` | `{ blueprintId }` | Most recent file |
| | `listChangeOrders` | `{ projectId }` | All change orders |
| **Permits** | `listByProject` | `{ projectId }` | All permits |
| | `listByZone` | `{ zoneId }` | Permits for a specific zone |
| | `listExpiring` | `{ hoursThreshold? }` | Permits expiring soon |
| | `listZonesByProject` | `{ projectId }` | All work zones |
| | `getZoneById` | `{ zoneId }` | Single zone |
| | `getPermitStats` | `{ projectId }` | Zone/permit statistics |
| **Kanban** | `getBoardByProject` | `{ projectId }` | Board with columns |
| | `getBoardById` | `{ boardId }` | Single board |
| | `getCardsByBoard` | `{ boardId }` | All cards, ordered by column+order |
| | `getCardsByColumn` | `{ boardId, columnId }` | Cards in one column |
| | `getMyTasks` | `{ userId, projectId }` | Cards assigned to user |
| | `getCardById` | `{ cardId }` | Single card |

### Mutation Functions

Each mutation is available via `client.mutation(mutationName, args)` or typed helpers.

| Module | Mutation | Key Args | Role Required |
|--------|----------|----------|---------------|
| **Deliveries** | `create` | `{ projectId, title, supplier, materialList, eta }` | procurement, admin |
| | `updateStatus` | `{ deliveryId, newStatus }` | procurement, admin |
| | `confirmReceipt` | `{ deliveryId, receiptPhoto?, signature? }` | field_engineer, admin |
| | `updateEta` | `{ deliveryId, eta }` | procurement |
| | `remove` | `{ deliveryId }` | admin |
| **Inspections** | `create` | `{ projectId, title, checklist }` | architect |
| | `startInspection` | `{ inspectionId }` | field_engineer |
| | `updateChecklistItem` | `{ inspectionId, itemIndex, passed?, notes?, photoIds? }` | field_engineer |
| | `completeInspection` | `{ inspectionId, status }` | field_engineer |
| **Blueprints** | `create` | `{ projectId, title, description? }` | architect, admin |
| | `uploadNewRevision` | `{ blueprintId, fileStorageId, changeLog? }` | architect |
| | `updateStatus` | `{ blueprintId, newStatus }` | architect, pm |
| | `createChangeOrder` | `{ blueprintId, projectId, title, description }` | architect, pm |
| | `approveChangeOrder` | `{ changeOrderId }` | architect, pm |
| **Permits** | `createPermit` | Various | hse_officer |
| | `activatePermit` | `{ permitId }` | hse_officer |
| | `suspendZone` | `{ zoneId, reason }` | hse_officer |
| | `reactivateZone` | `{ zoneId }` | hse_officer |
| | `createZone` | `{ projectId, name, svgPath }` | hse_officer, admin |
| **Kanban** | `createBoard` | `{ projectId, title }` | pm, admin |
| | `createCard` | `{ boardId, title, priority, description?, assigneeId? }` | all roles |
| | `moveCard` | `{ cardId, columnId, order? }` | all roles |
| | `updateCard` | Various | all roles |
| | `deleteCard` | `{ cardId }` | pm, admin |

---

## Deployment

### Docker (Production)

The multi-stage Dockerfile produces a minimal production image:

```bash
# Build
docker build -t sitesync-pro .

# Run
docker run -p 3000:3000 \
  -e CONVEX_URL=your-url \
  -e BETTER_AUTH_SECRET=your-secret \
  sitesync-pro
```

The image includes:
- **Health check** — HTTP GET `/health` every 30s
- **Non-root user** — Runs as `svelte:1001` with `runAsNonRoot`
- **OCI labels** — Standard metadata annotations
- **Seccomp** — RuntimeDefault profile
- **Read-only root** — Container security context enforces `readOnlyRootFilesystem: true`

### Docker Compose (Local Dev + Monitoring)

```bash
docker compose up
```

Spins up:
- **SvelteKit** — App on port 3000
- **Prometheus** — Metrics on port 9090
- **Grafana** — Dashboards on port 3001 (admin/sitesync)

### Kubernetes (K3s + ArgoCD)

1. **Provision infrastructure** via Terraform (Oracle Cloud free tier):
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

2. **ArgoCD auto-syncs** — The ArgoCD Application manifest at `kubernetes/argocd-application.yaml` points to this repository and syncs on every push to `main`.

3. **Production features**:
   - 2 replicas with `topologySpreadConstraints` for HA
   - HPA: CPU 60%, memory 80%
   - PDB: `minAvailable: 1`
   - NetworkPolicy: Default deny, allow only Traefik on 80/443
   - TLS: cert-manager ClusterIssuer with production Let's Encrypt
   - Pod disruption budget ensures availability during updates

### Environment Variables (Production)

| Variable | Source | Required |
|----------|--------|----------|
| `CONVEX_URL` | Convex dashboard | ✅ |
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` | ✅ |
| `BETTER_AUTH_URL` | Deployment URL | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `3000` | ✅ |

---

## Monitoring & Observability

### Prometheus Metrics

Available at `/metrics` endpoint on the SvelteKit server:

| Metric | Type | Description |
|--------|------|-------------|
| `sitesync_active_users` | Gauge | Currently logged-in users |
| `sitesync_open_tasks` | Gauge | Tasks not in "Done" column |
| `sitesync_expiring_permits` | Gauge | Permits expiring within 24h |
| `sitesync_delivery_delay_hours` | Histogram | Delivery delay distribution (buckets: 1,4,8,24,48,72) |

### Grafana Dashboard

A pre-configured **"Site Health"** dashboard is provisioned at `docker/grafana/dashboards/site-health.json`:

- **Active Users** — Gauge panel
- **Open Tasks by Project** — Bar chart
- **Expiring Permits** — Table with color-coded urgency
- **Delivery Delay** — Histogram
- **Task Movement Rate** — Real-time counter

### Alerting

PrometheusRules configured at `kubernetes/prometheus-rules.yaml`:

| Rule | Condition | Severity |
|------|-----------|----------|
| `HighErrorRate` | >5% errors over 5 minutes | critical |
| `HighLatency` | p99 latency > 2s | warning |
| `PodCrashLooping` | Pod restart count > 3 | critical |
| `HighMemoryUsage` | Memory > 85% | warning |

Grafana alerting contact points support email and Slack webhook notifications.

---

## CI/CD Pipeline

The CI/CD pipeline (`./github/workflows/ci.yml`) runs on every push/PR to `main`:

```
Push/PR to main
      │
      ▼
┌─────────────┐
│  Quality     │  Lint, svelte-check, Terraform format check
│  Checks      │
└──────┬──────┘
       │ (must pass)
       ▼
┌─────────────┐
│  Security    │  Trivy filesystem scan, CodeQL analysis
│  Scan        │  (non-blocking, results uploaded to GitHub Security)
└──────┬──────┘
       │ (always runs)
       ▼
┌─────────────┐
│  Build       │  1. Build all 5 Vue widgets
│  & Test      │  2. Build SvelteKit
               │  3. Generate SBOM (CycloneDX)
               │  4. Build + push Docker image (multi-arch: amd64 + arm64)
               │  5. Trivy container scan
               │  6. Upload artifacts
└──────┬──────┘
       │ (on main push)
       ▼
┌─────────────┐
│  Deploy      │  kubectl set image → rollout status (5m timeout)
│  (K3s)       │
└─────────────┘
```

**Key security features**:
- Trivy scans both filesystem and final Docker image
- CodeQL `security-and-quality` query suite
- SBOM attached to every build as a downloadable artifact
- Docker build with `provenance: true` and `sbom: true` attestations
- All scans non-blocking (report-only mode with optional fail)

---

## Roadmap

### In Progress
- [ ] End-to-end tests (Playwright)
- [ ] Optimistic update patterns in Vue widgets
- [ ] Offline mutation queue (indexedDB-backed)

### Planned
- [ ] Mobile push notifications (Web Push API)
- [ ] Real-time collaborative editing for inspection notes
- [ ] Advanced filtering and saved views across all modules
- [ ] Multi-project dashboard with cross-project analytics
- [ ] Export to Excel/CSV for all data tables
- [ ] Webhook integration for external system notifications

### Future
- [ ] Native mobile app (via Capacitor or Tauri)
- [ ] BIM model viewer (Three.js integration)
- [ ] AI-powered schedule optimization
- [ ] IoT sensor integration for environmental monitoring
- [ ] Subcontractor portal (limited-access external users)

---

## Contributing

### Development Workflow

1. **Branch**: Create a branch from `main` with a descriptive name
2. **Develop**: Make changes, ensure type safety, add tests
3. **Build**: Run `pnpm build:all` to verify all packages build
4. **Check**: Run `pnpm check` for type validation
5. **Test**: Run `pnpm test` for unit tests
6. **PR**: Open a pull request against `main`

### Code Style

- **TypeScript**: Strict mode, no `any` casts, prefer branded types
- **Components**: Follow existing patterns (shadcn-svelte for UI, Svelte 5 runes for state)
- **Convex**: Every mutation needs `requireAuth` + `requireRole` middleware
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.)

### Architecture Decisions

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for design decisions and rationale.

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for construction teams who need information <strong>now</strong>, not after the next site visit.
  <br>
  <a href="https://convex.dev">Convex</a> ·
  <a href="https://kit.svelte.dev">SvelteKit</a> ·
  <a href="https://vuejs.org">Vue 3</a> ·
  <a href="https://tailwindcss.com">Tailwind CSS</a> ·
  <a href="https://argoproj.github.io/cd/">ArgoCD</a>
</p>
