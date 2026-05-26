# SiteSync Pro — Full Build Plan & Status

> This file contains the complete implementation plan. Update the checkboxes and status sections as work progresses. Any AI agent reading this file should have full context of what's been done and what remains.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                           Browser                                       │
├────────────────────┬───────────────────────────────────────────────────┤
│   SvelteKit 5 App  │     Vue 3 Widgets (mounted via onMount)           │
│   (apps/sveltekit) │                                                   │
│                    │  ┌──────────────┐  ┌──────────────┐               │
│   Routes:          │  │  Delivery    │  │  Inspection   │               │
│   /app/deliveries  │  │  Tracker     │  │  Form         │               │
│   /app/inspections │  └──────────────┘  └──────────────┘               │
│   /app/blueprints  │  ┌──────────────┐  ┌──────────────┐               │
│   /app/safety      │  │  Blueprint   │  │  Safety       │               │
│   /app/my-tasks    │  │  Viewer      │  │  Heatmap      │               │
│                    │  └──────────────┘  └──────────────┘               │
│   Layout:          │  ┌──────────────┐                                 │
│   Sidebar + Header │  │  Kanban      │                                 │
│   + ToastContainer │  │  Board       │                                 │
│                    │  └──────────────┘                                 │
├────────────────────┴───────────────────────────────────────────────────┤
│                        Convex JS Client (WebSocket)                     │
├────────────────────────────────────────────────────────────────────────┤
│                         Convex Backend (convex/)                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│  │Deliveries │ │Inspections│ │ Blueprints│ │   Safety  │ │  Kanban   ││
│  │ Queries(4)│ │ Queries(3)│ │ Queries(5)│ │ Queries(6)│ │ Queries(6)││
│  │ Mutations │ │ Mutations │ │ Mutations │ │ Mutations │ │ Mutations ││
│  │     (5)   │ │     (4)   │ │   (4) + 2 │ │    (6)    │ │    (5)    ││
│  │           │ │           │ │  actions  │ │           │ │           ││
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘│
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Middleware: requireAuth, requireRole, validateStatusTransition  │  │
│  │  Scheduled: expirePermits (hourly), generateDailyLogs (24h)     │  │
│  │  Auth: Better Auth (magic link) + @convex-dev/better-auth       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
sitesync-pro/
├── pnpm-workspace.yaml
├── package.json                          # root scripts
├── tsconfig.json                         # strict mode base config
├── .prettierrc
├── .gitignore
├── todo.md                               # THIS FILE
├── DESIGN_SYSTEM.md
├── README.md
├── apps/
│   └── sveltekit/                        # SvelteKit 5 + SvelteKit 2
│       ├── package.json
│       ├── svelte.config.js
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── app.html
│           ├── app.css                   # Tailwind v4 + design tokens
│           ├── app.d.ts
│           ├── hooks.server.ts           # Auth guard
│           ├── lib/
│           │   ├── components/
│           │   │   ├── ui/               # 13 shadcn-svelte components
│           │   │   │   ├── Button.svelte
│           │   │   │   ├── Card.svelte
│           │   │   │   ├── Input.svelte
│           │   │   │   ├── Select.svelte
│           │   │   │   ├── Modal.svelte
│           │   │   │   ├── DataTable.svelte
│           │   │   │   ├── Toast.svelte
│           │   │   │   ├── ToastContainer.svelte
│           │   │   │   ├── Badge.svelte
│           │   │   │   ├── Skeleton.svelte
│           │   │   │   ├── Avatar.svelte
│           │   │   │   ├── Tabs.svelte
│           │   │   │   └── Tooltip.svelte
│           │   │   ├── layout/
│           │   │   │   ├── Sidebar.svelte
│           │   │   │   └── Header.svelte
│           │   │   └── widgets/
│           │   │       ├── DeliveryTrackerWrapper.svelte
│           │   │       └── WidgetWrapper.svelte        # generic wrapper
│           │   ├── stores/
│           │   │   ├── theme.ts                         # mode-watcher + localStorage
│           │   │   ├── toast.ts                         # toast notification store
│           │   │   ├── convex.ts                        # ConvexClient singleton
│           │   │   └── convex-query.ts                  # useConvexQuery Svelte store
│           │   ├── utils/
│           │   │   ├── cn.ts                            # clsx + tailwind-merge
│           │   │   └── widget-loader.ts                 # lazy-load Vue widget helper
│           │   └── design/
│           │       └── tokens.ts                        # shared token constants
│           └── routes/
│               ├── +layout.svelte                       # root layout
│               ├── +page.svelte                         # landing page
│               ├── login/
│               │   └── +page.svelte                     # magic link login
│               ├── app/
│               │   ├── +layout.svelte                   # authenticated layout (sidebar + header)
│               │   ├── +layout.server.ts                # auth guard + user data
│               │   ├── +page.svelte                     # dashboard
│               │   ├── deliveries/+page.svelte
│               │   ├── inspections/+page.svelte
│               │   ├── blueprints/+page.svelte
│               │   ├── safety/+page.svelte
│               │   ├── my-tasks/+page.svelte
│               │   ├── projects/+page.svelte
│               │   ├── settings/+page.svelte
│               │   └── users/+page.svelte
│               ├── api/
│               │   └── inspection-summary/
│               │       └── [projectId]/
│               │           └── +server.ts               # PDF generation endpoint
│               └── metrics/
│                   └── +server.ts                       # Prometheus metrics
├── widgets/                               # each = separate Vite library package
│   ├── delivery-tracker/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts                   # mount/unmount exports
│   │       └── DeliveryTrackerWidget.vue  # tabs, table, map, receipt
│   ├── inspection-form/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       └── InspectionFormWidget.vue   # checklist, pass/fail, audit trail
│   ├── blueprint-viewer/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       └── BlueprintViewerWidget.vue  # OpenSeadragon deep-zoom
│   ├── safety-heatmap/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       └── SafetyHeatmapWidget.vue    # SVG floor plan, zone colors
│   └── kanban-board/
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── index.ts
│           └── KanbanBoardWidget.vue      # drag-and-drop columns
├── packages/
│   ├── convex-vue-client/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts                  # getConvexClient, useConvexQuery, useMutation, useOptimisticMutation
│   └── design-tokens/
│       ├── package.json
│       └── src/
│           └── tokens.ts                 # colors, typography, spacing constants
├── convex/                                # shared Convex backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── schema.ts                          # 13 tables with indexes
│   ├── auth.config.ts                     # Better Auth config
│   ├── auth.ts                            # createAuth with magic link
│   ├── http.ts                            # route registration + health
│   ├── convex.config.ts                   # app definition
│   ├── crons.ts                           # scheduled jobs
│   └── functions/
│       ├── middleware.ts                  # requireAuth, requireRole, validateDeliveryStatusTransition
│       ├── deliveries/
│       │   ├── queries.ts                 # listByProject, getById, listByStatus, getActiveDeliveries, getDeliveryCounts
│       │   └── mutations.ts              # create, updateStatus, confirmReceipt, updateEta, remove
│       ├── inspections/
│       │   ├── queries.ts                 # listByProject, getById, listByAssignee, getCounts
│       │   └── mutations.ts              # create, startInspection, updateChecklistItem, completeInspection
│       ├── blueprints/
│       │   ├── queries.ts                 # listByProject, getById, getRevisions, getLatestRevision, listChangeOrders
│       │   ├── mutations.ts              # create, uploadNewRevision, updateStatus, createChangeOrder, approveChangeOrder
│       │   └── actions.ts                # convertPdfToPages, autoTagInspectionPhoto
│       ├── permits/
│       │   ├── queries.ts                 # listByProject, listByZone, listExpiring, listZonesByProject, getZoneById, getPermitStats
│       │   ├── mutations.ts              # createPermit, activatePermit, suspendZone, reactivateZone, revokePermit, createZone
│       │   └── scheduled.ts              # expirePermits (hourly)
│       ├── kanban/
│       │   ├── queries.ts                 # getBoardByProject, getBoardById, getCardsByBoard, getCardsByColumn, getMyTasks, getCardById
│       │   └── mutations.ts              # createBoard, createCard, moveCard, updateCard, deleteCard
│       ├── projects/
│       │   ├── queries.ts                 # list, listAll, getById, listMembers
│       │   └── mutations.ts              # create, addMember, updateStatus
│       ├── users/
│       │   ├── queries.ts                 # me, list, getById, findUsersByRole
│       │   └── mutations.ts              # createUser, updateRole, deactivateUser
│       └── dailyLogs/
│           └── scheduled.ts              # generateDailyLogs (24h)
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       ├── dashboards/
│       │   └── site-health.json
│       ├── datasources/
│       │   └── prometheus.yml
│       ├── provisioning/
│       │   └── dashboards/
│       │       └── dashboards.yaml
│       └── alerting/
│           └── contact-points.yaml
├── kubernetes/
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── network-policy.yaml
│   ├── pod-disruption-budget.yaml
│   ├── service-account.yaml
│   ├── prometheus-rules.yaml
│   └── argocd-application.yaml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── cloud-init.yaml
├── .pre-commit-config.yaml
└── .github/
    ├── dependabot.yml
    └── workflows/
        └── ci.yml
```

---

## Design Tokens (app.css)

```
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

Font: 'Inter' (400, 500, 600, 700) via Google Fonts

@theme inline {
  --font-sans: 'Inter', sans-serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: oklch(0.55 0.17 255);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-secondary: oklch(0.95 0.03 240);
  --color-secondary-foreground: oklch(0.25 0.05 240);
  --color-muted: oklch(0.96 0.01 260);
  --color-muted-foreground: oklch(0.55 0.02 260);
  --color-accent: oklch(0.55 0.18 280);
  --color-accent-foreground: oklch(0.98 0 0);
  --color-destructive: oklch(0.58 0.22 28);
  --color-destructive-foreground: oklch(0.98 0 0);
  --color-border: oklch(0.9 0.01 260);
  --color-input: oklch(0.9 0.01 260);
  --color-ring: oklch(0.55 0.17 255);
  --color-success: oklch(0.6 0.18 145);
  --color-warning: oklch(0.7 0.18 85);
  --color-danger: oklch(0.58 0.22 28);

  --radius-sm: calc(0.5rem - 2px);
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-md: 0 4px 12px oklch(0 0 0 / 0.06);
  --shadow-lg: 0 8px 24px oklch(0 0 0 / 0.08);

  --text-h1: 2.5rem;       --text-h1--line-height: 1.1;   --text-h1--letter-spacing: -0.03em;
  --text-h2: 2rem;          --text-h2--line-height: 1.15;  --text-h2--letter-spacing: -0.02em;
  --text-h3: 1.5rem;        --text-h3--line-height: 1.2;   --text-h3--letter-spacing: -0.01em;
  --text-body: 1rem;        --text-body--line-height: 1.6;
  --text-small: 0.875rem;
  --text-xs: 0.75rem;
}

.dark {
  --background: oklch(0.15 0.02 260);
  --foreground: oklch(0.93 0.01 260);
  --primary: oklch(0.65 0.15 255);
  --primary-foreground: oklch(0.15 0.02 260);
  --secondary: oklch(0.22 0.03 260);
  --secondary-foreground: oklch(0.93 0.01 260);
  --muted: oklch(0.2 0.02 260);
  --muted-foreground: oklch(0.65 0.02 260);
  --accent: oklch(0.35 0.15 280);
  --accent-foreground: oklch(0.93 0.01 260);
  --destructive: oklch(0.58 0.22 28);
  --destructive-foreground: oklch(0.93 0.01 260);
  --border: oklch(0.25 0.02 260);
  --input: oklch(0.25 0.02 260);
  --ring: oklch(0.65 0.15 255);
  --success: oklch(0.55 0.15 145);
  --warning: oklch(0.6 0.16 85);
  --danger: oklch(0.55 0.2 28);

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.3);
  --shadow-md: 0 4px 12px oklch(0 0 0 / 0.4);
  --shadow-lg: 0 8px 24px oklch(0 0 0 / 0.5);
}

:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.15 0.02 260);
}
```

---

## UI Component Library

All in `apps/sveltekit/src/lib/components/ui/`.

| Component      | Props                                                                                             | Notes                                       |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Button         | `variant` (primary/secondary/outline/ghost/destructive), `size` (sm/md/lg), `loading`, `disabled` | Uses bits-ui Button                         |
| Card           | `variant` (default/interactive), `padding` (sm/md/lg)                                             | Subtle border, hover shadow for interactive |
| Input          | `label`, `error`, `hint`, `placeholder`, `type`                                                   | Clean border, focus ring                    |
| Select         | `options`, `value`, `placeholder`                                                                 | Native select styled consistently           |
| Modal          | `open`, `title`, `size`, `closeOnOverlay`                                                         | Slide-up mobile, fade+scale desktop         |
| DataTable      | `columns`, `data`, `sortable`, `searchable`, `emptyMessage`                                       | Virtualized rows, row hover                 |
| Toast          | `type` (success/error/info/warning), `message`, `action`                                          | Slide-in top-right, auto-dismiss            |
| ToastContainer | —                                                                                                 | Fixed position, renders toast stack         |
| Badge          | `variant` (default/success/warning/danger/outline), `size`                                        | Pill-shaped, subtle tint                    |
| Skeleton       | `variant` (text/circle/rect), `width`, `height`                                                   | Shimmer animation                           |
| Avatar         | `src`, `alt`, `fallback`, `size`                                                                  | Initials fallback                           |
| Tabs           | `tabs` (array of {id, label}), `activeTab`                                                        | Underline style, smooth indicator           |
| Tooltip        | `content`, `position` (top/bottom/left/right)                                                     | CSS-only, no JS dependency                  |

---

## Convex Schema (13 Tables)

All in `convex/schema.ts`:

### users

- `email: string`, `name: string`, `role: union(admin|project_manager|procurement|architect|field_engineer|hse_officer)`
- `avatarUrl?: string`, `phone?: string`, `isActive: boolean`
- Index: `by_email` on `email`

### projects

- `name: string`, `code: string`, `description?: string`, `address: string`
- `status: union(active|completed|on_hold|cancelled)`
- `startDate: number`, `endDate?: number`, `createdBy: id(users)`
- Index: `by_status` on `status`

### projectMembers

- `projectId: id(projects)`, `userId: id(users)`, `role: string`
- Indexes: `by_project` on `projectId`, `by_user` on `userId`

### deliveries

- `projectId: id(projects)`, `zoneId?: id(workZones)`
- `title: string`, `supplier: string`
- `materialList: array({name, quantity, unit})`
- `status: union(ordered|dispatched|in_transit|on_site|received_inspected)`
- `eta: number`, `actualArrival?: number`, `notes?: string`
- `receiptPhoto?: string`, `signature?: string`, `receivedBy?: id(users)`
- `createdAt: number`, `updatedAt: number`, `updatedBy: id(users)`
- Indexes: `by_project`, `by_status`, `by_project_status` on `[projectId, status]`

### inspections

- `projectId: id(projects)`, `zoneId?: id(workZones)`
- `title: string`
- `checklist: array({item, required, passed?, notes?, photoIds?})`
- `status: union(pending|in_progress|passed|failed|remedial)`
- `assigneeId?: id(users)`, `createdBy: id(users)`
- `createdAt: number`, `completedAt?: number`
- `auditTrail: array({action, userId, timestamp, detail?})`
- Indexes: `by_project`, `by_status`, `by_assignee`

### blueprints

- `projectId: id(projects)`, `title: string`, `description?: string`
- `currentRevision: number`
- `status: union(draft|in_review|approved|for_construction)`
- `createdBy: id(users)`, `createdAt: number`
- Index: `by_project`

### blueprintRevisions

- `blueprintId: id(blueprints)`, `revisionNumber: number`
- `fileStorageId: string`, `fileUrl?: string`
- `uploadedBy: id(users)`, `changeLog?: string`, `uploadedAt: number`
- Indexes: `by_blueprint`, `by_blueprint_revision` on `[blueprintId, revisionNumber]`

### changeOrders

- `blueprintId: id(blueprints)`, `projectId: id(projects)`
- `title: string`, `description: string`
- `status: union(proposed|approved|rejected|implemented)`
- `requestedBy: id(users)`, `approvedBy?: id(users)`
- `createdAt: number`, `approvedAt?: number`
- Indexes: `by_blueprint`, `by_project`

### workZones

- `projectId: id(projects)`, `name: string`
- `svgPath: string` (SVG path data for heatmap)
- `status: union(active|suspended|completed)`
- `suspendedReason?: string`, `suspendedBy?: id(users)`, `suspendedAt?: number`
- Indexes: `by_project`, `by_status`

### permits

- `projectId: id(projects)`, `zoneId?: id(workZones)`
- `type: union(hot_work|confined_space|height_work|electrical|general)`
- `status: union(applied|active|expired|suspended)`
- `issuedTo: id(users)`, `issuedBy?: id(users)`
- `appliedAt: number`, `activeAt?: number`, `expiresAt: number`
- `suspendedAt?: number`, `notes?: string`
- Indexes: `by_zone`, `by_status`, `by_expiry`

### kanbanBoards

- `projectId: id(projects)`, `title: string`
- `columns: array({id: string, title: string, order: number})`
- `createdBy: id(users)`
- Index: `by_project`

### kanbanCards

- `boardId: id(kanbanBoards)`, `columnId: string`
- `title: string`, `description?: string`, `assigneeId?: id(users)`
- `priority: union(low|medium|high|critical)`
- `status: union(backlog|ready|in_progress|qc|done|blocked)`
- `order: number`
- `linkedDeliveryId?: id(deliveries)`, `linkedInspectionId?: id(inspections)`, `linkedBlueprintId?: id(blueprints)`
- `blockedReason?: string`, `dueDate?: number`
- `createdAt: number`, `updatedAt: number`
- Indexes: `by_board`, `by_column` on `[boardId, columnId]`, `by_assignee`

### dailyLogs

- `projectId: id(projects)`, `date: string` (YYYY-MM-DD)
- `summary: string`
- `taskMovements: array({cardId, fromColumn, toColumn, timestamp})`
- `deliveriesReceived: array(id(deliveries))`
- `inspectionsCompleted: array(id(inspections))`
- `permitsExpiring: array(id(permits))`
- `generatedAt: number`
- Index: `by_project_date` on `[projectId, date]`

### presence

- `user: id(users)`, `resourceType: string`, `resourceId: string`
- `updatedAt: number`
- Indexes: `by_resource` on `[resourceType, resourceId]`, `by_user`

---

## Convex Functions

### Middleware (`convex/functions/middleware.ts`)

- `requireAuth()` — checks `ctx.auth.getUserIdentity()`, throws if unauthenticated
- `requireRole(allowedRoles: string[])` — checks user role from DB, throws if not in list
- `validateDeliveryStatusTransition(fromStatus, toStatus)` — enforces: ordered→dispatched→in_transit→on_site→received_inspected

### Deliveries

Queries:

- `listByProject(projectId)` — all deliveries, ordered by ETA
- `getById(deliveryId)` — single delivery with all details
- `listByStatus(projectId, status)` — filter for dashboard tabs
- `getActiveDeliveries(projectId)` — non-received, ordered by urgency
- `getDeliveryCounts(projectId)` — { active, inTransit, received, expiringSoon }

Mutations:

- `create(args)` — validates role = procurement/admin
- `updateStatus(deliveryId, newStatus)` — validates transition rules
- `confirmReceipt(deliveryId, photo?, signature?)` — sets receivedBy, moves to received_inspected
- `updateEta(deliveryId, eta)` — updates, broadcasts change
- `remove(deliveryId)` — soft/hard delete based on role

### Inspections

Queries:

- `listByProject(projectId)` — all inspections
- `getById(inspectionId)` — single with checklist + audit trail
- `listByAssignee(assigneeId)` — inspections assigned to user
- `getCounts(projectId)` — { pending, inProgress, passed, failed, overdue }

Mutations:

- `create(args)` — architect creates checklist
- `startInspection(inspectionId)` — field engineer claims
- `updateChecklistItem(inspectionId, itemIndex, passed, notes?)` — real-time per-item
- `completeInspection(inspectionId, status)` — finalize with passed/failed/remedial

### Blueprints

Queries:

- `listByProject(projectId)` — all blueprints
- `getById(blueprintId)` — single with latest revision
- `getRevisions(blueprintId)` — revision history
- `getLatestRevision(blueprintId)` — most recent file
- `listChangeOrders(projectId)` — all change orders

Mutations:

- `create(args)` — creates blueprint + first revision
- `uploadNewRevision(blueprintId, fileStorageId, changeLog?)` — increments revision
- `updateStatus(blueprintId, newStatus)` — draft→in_review→approved→for_construction
- `createChangeOrder(args)` — links to blueprint
- `approveChangeOrder(changeOrderId)` — sets approvedBy, status→approved

Actions:

- `convertPdfToPages(blueprintRevisionId)` — uses pdfjs-dist to render PDF pages as PNGs, stores each as Convex file
- `autoTagInspectionPhoto(photoStorageId)` — uses Gemini AI free tier to tag photo, degrades gracefully if no API key

### Permits

Queries:

- `listByProject(projectId)` — all permits
- `listByZone(zoneId)` — permits for a specific zone
- `listExpiring(hoursThreshold=24)` — permits expiring soon
- `listZonesByProject(projectId)` — all work zones
- `getZoneById(zoneId)` — single zone
- `getPermitStats(projectId)` — { active, expiring, expired, suspended }

Mutations:

- `createPermit(args)` — HSE officer creates
- `activatePermit(permitId)` — moves applied→active
- `suspendZone(zoneId, reason)` — sets zone suspended, queries kanbanCards linked to zone, sets status→blocked with blockedReason
- `reactivateZone(zoneId)` — reverses suspension
- `revokePermit(permitId)` — emergency revocation
- `createZone(args)` — creates work zone

Scheduled:

- `expirePermits` — hourly cron. Finds active permits where expiresAt < now, sets expired. Broadcasts zone changes.

### Kanban

Queries:

- `getBoardByProject(projectId)` — board with columns
- `getBoardById(boardId)` — single board
- `getCardsByBoard(boardId)` — all cards, ordered by column+order
- `getCardsByColumn(boardId, columnId)` — cards in one column
- `getMyTasks(userId, projectId)` — cards where assigneeId = userId
- `getCardById(cardId)` — single card

Mutations:

- `createBoard(args)` — PM configures columns
- `createCard(args)` — add task
- `moveCard(cardId, columnId, order)` — drag-and-drop backend
- `updateCard(cardId, args)` — edit title, description, priority, assignee
- `deleteCard(cardId)` — remove card

### Projects

Queries:

- `list()` — projects where current user is member
- `listAll()` — all projects (admin only)
- `getById(projectId)` — single project
- `listMembers(projectId)` — project members

Mutations:

- `create(args)` — creates project + adds creator as admin member
- `addMember(projectId, userId, role)` — adds member
- `updateStatus(projectId, newStatus)` — admin only

### Users

Queries:

- `me()` — current user
- `list()` — all active users
- `getById(userId)` — single user
- `findUsersByRole(role)` — filter by role

Mutations:

- `createUser(args)` — admin creates user
- `updateRole(userId, newRole)` — admin changes role
- `deactivateUser(userId)` — admin deactivates

---

## Vue Widget Infrastructure

### `packages/convex-vue-client/src/index.ts`

Exports:

- `getConvexClient(url: string): ConvexClient` — singleton, creates client if needed
- `useConvexQuery<T>(client, queryFn, ...args): { data: Ref<T>, isLoading: Ref<boolean>, error: Ref<Error> }` — reactive query subscription, auto-unsubscribes on unmount
- `useMutation(client, mutationName): (...args) => Promise` — wraps client.mutation
- `useOptimisticMutation(client, mutationName): (args, optimisticUpdate?) => Promise` — mutation with optimistic rollback

### Widget Vite Library Config Pattern (`widgets/*/vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WidgetName',
      formats: ['es', 'umd'],
      fileName: 'widget-name',
    },
    rollupOptions: {
      external: ['vue', 'convex/browser'],
      output: { globals: { vue: 'Vue', 'convex/browser': 'ConvexClient' } },
    },
  },
});
```

### Widget Mount/Unmount Pattern (`widgets/*/src/index.ts`)

```ts
import { createApp } from 'vue';
import WidgetComponent from './WidgetComponent.vue';
import { getConvexClient } from '@sitesync/convex-vue-client';

export function mountWidgetName(
  container: HTMLElement,
  props: { convexUrl: string; projectId: string; userId: string; userRole: string },
): ComponentPublicInstance {
  const client = getConvexClient(props.convexUrl);
  const app = createApp(WidgetComponent, { ...props, client });
  return app.mount(container);
}
```

### SvelteKit Mount Pattern (`DeliveryTrackerWrapper.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { convexUrl } from '$stores/convex';
  import { page } from '$app/stores';

  let container = $state<HTMLDivElement | null>(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const { mountDeliveryTracker } = await import('@sitesync/delivery-tracker');
      mountDeliveryTracker(container!, {
        convexUrl: $convexUrl,
        projectId: $page.data.user?.projectId || '',
        userId: $page.data.user?.id || '',
        userRole: $page.data.user?.role || 'field_engineer',
      });
      loading = false;
    } catch (err) {
      error = `Failed: ${(err as Error).message}`;
      loading = false;
    }
  });
</script>
```

---

## Better Auth Integration

### `convex/auth.config.ts`

```ts
import { getAuthConfigProvider } from '@convex-dev/better-auth/plugins/convex';
import type { AuthConfig } from '@convex-dev/better-auth';
export default { providers: [getAuthConfigProvider()] } satisfies AuthConfig;
```

### `convex/auth.ts`

Creates `auth` with `betterAuth.createAuth({ providers: [magicLink], ... })`

### `convex/http.ts`

```ts
import { httpRouter } from 'convex/server';
import { auth } from './auth';
const http = httpRouter();
auth.registerRoutes(http);
http.route({ path: '/health', method: 'GET', handler: async () => new Response('OK') });
export default http;
```

### `convex/convex.config.ts`

App definition with `betterAuth` component registered.

---

## SvelteKit Auth & Layouts

### `src/hooks.server.ts`

- Checks `event.locals.auth()` on every request
- Public routes: `/login`, `/register`, `/api/auth`, `/auth`, `/metrics`, `/health`
- Sets `event.locals.user` from session if authenticated
- Redirects to `/login` if unauthenticated on protected routes
- Redirects to `/app` if already authenticated on `/login`

### `src/routes/app/+layout.server.ts`

- Reads `locals.user` (set by hooks)
- Returns `{ user: { id, name, email, role, avatarUrl, projectId } }`
- Throws 303 redirect to `/login` if no user

### `src/routes/app/+layout.svelte`

- Sidebar (role-filtered nav items)
- Header (breadcrumb, theme toggle, user avatar with dropdown)
- ToastContainer
- Content area renders `{@render children()}`

---

## Delivery Tracker Widget Details

### Vue Widget (`DeliveryTrackerWidget.vue`)

- Real-time table with status badges, progress indicators per delivery
- Filter tabs: All | Ordered | In Transit | On Site | Received
- Leaflet map (via `leaflet` + `@types/leaflet` npm packages):
  - Truck markers with rotation animation
  - Simulated truck movement via `setInterval` updating reactive location ref (local only, not persisting to Convex)
  - Actual dispatches update a `lastGpsPing` field on the delivery record
- Receipt confirmation modal:
  - Camera/file upload using HTML5 `capture` attribute for mobile
  - Canvas-based signature pad (custom SVG path capture)
  - Confirm button calls `confirmReceipt` mutation
- Loading state: skeleton rows
- Empty state: "No deliveries yet" with illustration
- Real-time: when `useConvexQuery` detects a delivery status change, toast slides in
- Error handling: mutation errors caught and displayed as toasts

---

## Inspection Form Widget Details

### Vue Widget (`InspectionFormWidget.vue`)

- Checklist items rendered as cards with:
  - Pass/Fail toggle buttons (animated)
  - Notes text field
  - Photo capture button (stores to Convex storage, displays thumbnail)
- Progress bar: completed / total items
- Real-time sync: architect adds an item → field engineer sees it instantly
- Audit trail viewer: timeline of actions with user avatars and timestamps
- Submission confirmation flow

### PDF Generation (`src/routes/api/inspection-summary/[projectId]/+server.ts`)

- SvelteKit server endpoint
- Queries Convex for today's inspections
- Generates PDF via `pdf-lib` (pure JS, no headless Chrome)
- Returns PDF with proper Content-Type header

---

## Blueprint Viewer Widget Details

### Vue Widget (`BlueprintViewerWidget.vue`)

- Uses OpenSeadragon (free, open-source deep zoom viewer)
- Fetches image tiles from Convex storage URL
- Revision selector dropdown — switching loads new tileset
- Red badge overlay for linked change orders
- Zoom controls, full-screen mode
- Presence avatars: shows who else is viewing the same blueprint
- Loading state: spinner overlay
- Error state: retry button

### Convex Action (`convertPdfToPages`)

- On blueprint upload, uses `pdfjs-dist` to render each page as PNG
- Stores each page as separate Convex file
- Creates manifest of page tiles for OpenSeadragon
- Gracefully degrades if pdfjs-dist unavailable

---

## Safety Heatmap Widget Details

### Vue Widget (`SafetyHeatmapWidget.vue`)

- SVG floor plan rendered from zone `svgPath` data
- Zone fill colors:
  - Green (#22c55e): active
  - Red (#ef4444): suspended
  - Gray (#6b7280): completed
- Lock icon (SVG path) overlay on suspended zones
- Click zone → slide-over panel shows active permits
- Tooltip: zone name, status, expiring permits count
- Legend: status color indicators
- Loading state: skeleton, empty state

### Cross-Module Integration

- `suspendZone` mutation also queries `kanbanCards` where zone is linked via delivery/inspection
- Sets those cards: `status = 'blocked'`, `blockedReason = 'Zone {name} suspended'`
- `reactivateZone` reverses the above

---

## Kanban Board Widget Details

### Vue Widget (`KanbanBoardWidget.vue`)

- Drag-and-drop via `vue-draggable-plus` or `@vueuse/core`'s `useDraggable`
- Columns scroll horizontally on desktop, stack vertically on mobile
- Cards show: title, priority badge (color-coded), assignee avatar, due date, blocked indicator
- Drag animation: `<TransitionGroup>` with move class for smooth reordering
- Real-time: PM moves card → all viewers see it instantly via Convex subscription
- My Tasks filter: shows only cards where `assigneeId === currentUserId`
- Empty state illustrations per column
- Column header shows card count

---

## Scheduled Jobs

### `expirePermits` (hourly — `convex/functions/permits/scheduled.ts`)

- `cronJobs.interval('expire-permits', { hours: 1 }, handler)`
- Finds active permits where `expiresAt < Date.now()`
- Sets status → `expired`
- Broadcasts zone status changes to subscribers

### `generateDailyLogs` (24h — `convex/functions/dailyLogs/scheduled.ts`)

- Runs at 23:00 daily
- Aggregates per project:
  - KanbanCards that changed column today
  - Deliveries that reached `received_inspected` today
  - Inspections completed today
  - Permits that expired or expire tomorrow
- Creates/updates a `dailyLogs` record per project

---

## Docker & Compose

### `docker/Dockerfile` (multi-stage)

```
Stage 1 (builder): node:22-alpine, copy lockfiles + workspace config, pnpm install, pnpm build
Stage 2 (production): node:22-alpine, copy build output, expose 3000, CMD ["node", "build"]
```

### `docker/docker-compose.yml`

```yaml
services:
  sveltekit:   build: ., ports: 3000:3000, depends_on: [convex-dev, prometheus]
  convex-dev:  image: ghcr.io/get-convex/convex-dev:latest, ports: 3210:3210
  prometheus:  image: prom/prometheus, ports: 9090:9090
  grafana:     image: grafana/grafana, ports: 3001:3000, depends_on: [prometheus]
```

---

## Prometheus + Grafana

### `docker/prometheus/prometheus.yml`

```yaml
global: { scrape_interval: 15s }
scrape_configs:
  - job_name: 'sveltekit', static_configs: [{ targets: ['sveltekit:3000'] }], metrics_path: '/metrics'
```

### `src/routes/metrics/+server.ts`

Uses `prom-client` to expose:

- `sitesync_active_users` (Gauge) — currently logged-in users
- `sitesync_open_tasks` (Gauge) — tasks not in Done column
- `sitesync_expiring_permits` (Gauge) — permits expiring within 24h
- `sitesync_delivery_delay_hours` (Histogram, buckets: [1,4,8,24,48,72])

### Grafana Dashboard (`docker/grafana/dashboards/site-health.json`)

Panels:

- Active Users (gauge)
- Open Tasks by Project (bar chart)
- Expiring Permits (table, color-coded)
- Delivery Delay (histogram)
- Real-time task movement rate

---

## GitHub Actions

### `.github/workflows/ci.yml`

```yaml
on: push/PR to main
jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps: [checkout, pnpm/setup, node 22, pnpm install, pnpm lint, pnpm check, convex typecheck]
  build:
    needs: [lint-typecheck]
    steps: [checkout, pnpm install, pnpm build, docker/setup-buildx, docker/build-push to ghcr.io]
```

---

## K3s + ArgoCD

### `kubernetes/deployment.yaml`

- `Deployment`: name=sitesync-web, replicas=2, container port 3000
- Env from secrets: `CONVEX_URL`, `BETTER_AUTH_SECRET`
- `Service`: name=sitesync-web, port 80 → targetPort 3000

### `kubernetes/argocd-application.yaml`

- ArgoCD Application: namespace=argocd, dest=namespace sitesync, source from repo/kubernetes
- `syncPolicy: automated: { prune: true, selfHeal: true }`

---

## Terraform (Oracle Free Tier)

### `terraform/main.tf`

- Provider: `oracle/oci`, region `us-ashburn-1`
- Instance: `VM.Standard.A1.Flex` (ARM Ampere A1, 4 OCPUs, 24GB RAM — free tier eligible)
- Ubuntu image, SSH public key, cloud-init user_data

### `terraform/cloud-init.yaml`

- Installs K3s via `curl -sfL https://get.k3s.io | sh -`
- Creates `argocd` namespace
- Installs ArgoCD manifests
- Applies Kubernetes manifests from repo

---

## Design Decisions Summary

| Decision            | Choice                       | Rationale                                                      |
| ------------------- | ---------------------------- | -------------------------------------------------------------- |
| Monorepo            | pnpm workspaces              | Speed, strict isolation, no Turborepo overhead                 |
| Vue widget strategy | Separate Vite lib builds     | Clean separation, independent versioning, CDN-deliverable      |
| UI framework        | shadcn-svelte + mode-watcher | Production-tested, less code, excellent dark mode              |
| Vue Convex client   | Raw JS client                | Full `withOptimisticUpdate()`, stable API, no wrapper bugs     |
| Font                | Inter (Google Fonts)         | Highly readable, modern, free                                  |
| Color space         | oklch()                      | Perceptual uniformity across light/dark                        |
| Backend             | Convex Cloud                 | Zero ops, generous free tier, built-in real-time via WebSocket |
| Maps                | Leaflet + OpenStreetMap      | Free, no API key required                                      |
| PDF                 | pdf-lib                      | Pure JS, no headless Chrome dependency                         |
| Deep zoom           | OpenSeadragon                | Free, open-source, mature library                              |
| Auth                | Better Auth + magic link     | Self-hosted, passwordless, free                                |
| Deployment          | Docker → K3s → ArgoCD        | GitOps, free OCI compute, repeatable                           |
| Monitoring          | Prometheus + Grafana         | Industry standard, both free                                   |
| CI/CD               | GitHub Actions               | Free for public repos, simple config                           |
| Testing             | Features first, tests later  | Per user preference                                            |

---

## Effort Estimate

| Phase                    | Est. Hours | Status      |
| ------------------------ | ---------- | ----------- |
| P1: Scaffolding          | 2h         | DONE        |
| P2: Design System        | 6h         | DONE        |
| P3: Convex Schema + Auth | 3h         | DONE        |
| P4: Vue Infrastructure   | 3h         | DONE        |
| P5: Delivery Tracker     | 8h         | DONE        |
| P6: Inspection & QA      | 6h         | DONE        |
| P7: Blueprint Viewer     | 6h         | DONE        |
| P8: Safety & Permits     | 5h         | DONE        |
| P9: Kanban & Logs        | 6h         | DONE        |
| P10: Optimistic Updates  | 2h         | NOT STARTED |
| P11: Auth & Layouts      | 4h         | DONE        |
| P12–16: DevOps           | 6h         | DONE        |
| P17: README & Demo       | 2h         | DONE        |
| **Total**                | **~59h**   |             |

---

## Critical Blockers

1. **Convex `_generated/` files missing** — `npx convex dev` must be run in `convex/` directory. All function files import from `../_generated/server` or `../_generated/api` which are autogenerated by the Convex CLI. Until this is done, Convex functions cannot be tested or deployed.

2. **Better Auth env vars** — `BETTER_AUTH_SECRET` and `CONVEX_URL` environment variables must be set for auth to work. Without these, login will fail and the auth guard in `hooks.server.ts` will redirect all requests to `/login`.

---

## Current Status (2026-05-25)

### DONE (Phases 1-3, 11-13, 17)

- [x] pnpm monorepo with workspace config for `apps/*`, `widgets/*`, `packages/*`, `convex/`
- [x] Strict TypeScript root config
- [x] SvelteKit 5 + SvelteKit 2 app scaffolded with Node adapter
- [x] Tailwind v4 with custom design tokens (oklch palettes, Inter font, Major Third scale)
- [x] Theme store (mode-watcher + localStorage + system preference detection)
- [x] Toast notification store (addToast, removeToast with auto-dismiss)
- [x] 13 reusable UI components: Button, Card, Input, Select, Badge, Skeleton, Modal, Toast, ToastContainer, Avatar, Tooltip, Tabs, DataTable
- [x] Collapsible Sidebar with role-filtered navigation
- [x] Header with breadcrumb, theme toggle, user avatar
- [x] Login page (magic link placeholder)
- [x] Dashboard, Deliveries, Inspections, Blueprints, Safety, My Tasks pages
- [x] App layout with Sidebar + Header + ToastContainer + auth guard
- [x] Metrics endpoint (Prometheus format via prom-client)
- [x] Inspection PDF generation endpoint (pdf-lib)
- [x] `@sitesync/convex-vue-client` package (Vue composables for Convex)
- [x] `@sitesync/design-tokens` package (shared TS token constants)
- [x] Convex schema (13 tables with indexes and relationships)
- [x] Better Auth integration (auth.config.ts, auth.ts, http.ts, convex.config.ts)
- [x] Convex middleware (requireAuth, requireRole, validateDeliveryStatusTransition)
- [x] Deliveries: 5 queries, 5 mutations
- [x] Inspections: 4 queries, 4 mutations
- [x] Blueprints: 5 queries, 4 mutations, 2 actions (pdfjs-dist, Gemini AI)
- [x] Safety/Permits: 6 queries, 6 mutations (with cross-module Kanban blocking)
- [x] Kanban: 6 queries, 5 mutations
- [x] Projects: 4 queries, 3 mutations
- [x] Users: 4 queries, 3 mutations
- [x] Scheduled jobs: expirePermits (hourly), generateDailyLogs (24h)
- [x] Delivery Tracker Vue widget (tabs, status badges, loading/empty states)
- [x] Inspection Form Vue widget stub
- [x] Blueprint Viewer Vue widget stub (OpenSeadragon)
- [x] Safety Heatmap Vue widget stub (SVG floor plan)
- [x] Kanban Board Vue widget stub (drag-and-drop)
- [x] Reactive Convex query store for SvelteKit (useConvexQuery)
- [x] Vue widget loader utility
- [x] Generic WidgetWrapper Svelte component
- [x] Dashboard wired to real Convex queries
- [x] Deliveries page: DataTable + Create modal (calls deliveries:create)
- [x] Inspections page: "My Inspections" + full listing
- [x] Blueprints page: Blueprint/Change Order tabs + Upload modal
- [x] Safety page: Permits table + Create modal
- [x] My Tasks page: Real task list + Create modal
- [x] hooks.server.ts: Better Auth session handling, route protection
- [x] app.d.ts + +layout.server.ts: id, projectId in user types
- [x] Vue widget packages externalized in Vite SSR build config
- [x] Svelte 5 runes fixes (all components use $state, $derived, $props)
- [x] Workspace dependencies added to SvelteKit package.json
- [x] Build passes: `pnpm --filter @sitesync/sveltekit build` succeeds
- [x] Dockerfile + docker-compose.yml + Prometheus + Grafana configs
- [x] GitHub Actions CI (lint, typecheck, build, Docker push)
- [x] K3s manifests (deployment, service, ingress, ArgoCD application)
- [x] Terraform (OCI free tier: VCN, compute, security list, cloud-init)
- [x] DESIGN_SYSTEM.md + README.md (architecture diagram, setup, demo)
- [x] todo.md (this file)

### COMPLETED (Session 2 — 2026-05-25)

- [x] **Vue widget packages built** — All 5 packages build successfully: delivery-tracker, inspection-form, blueprint-viewer, safety-heatmap, kanban-board
- [x] **Widget packages fixed** — Added `@sitesync/convex-vue-client: workspace:*` dependency to all 5 widget package.json files; fixed delivery-tracker build script (removed vue-tsc --noEmit)
- [x] **Convex query bugs fixed** — `permits:listByProject` now uses correct `by_project` index; `blueprints:listChangeOrders` takes `projectId` instead of `blueprintId`; `kanban:getMyTasks` has optional `projectId` param; schema adds `by_project` index to permits
- [x] **Convex middleware registered** — requireAuth, requireRole, validateDeliveryStatusTransition all registered in middleware.ts
- [x] **InspectionForm widget completed** — Pass/fail toggle, notes text field, photo capture button, audit trail viewer with timeline, progress bar, complete inspection flow with confirmation dialog, loading/error states
- [x] **BlueprintViewer widget completed** — OpenSeadragon deep-zoom viewer, zoom controls (in/out/reset/fullscreen), revision switcher dropdown, navigator panel, info bar with metadata, loading/error states with retry
- [x] **SafetyHeatmap widget completed** — SVG floor plan with zone paths, zone fill colors by status (green=active, red=suspended, gray=completed), lock icon overlay on suspended zones, click zone → slide-over panel with permits, tooltip on hover, legend with status colors, sample zones fallback
- [x] **KanbanBoard widget completed** — Drag-and-drop via native HTML5 API, 6 columns (Backlog/Ready/In Progress/QC/Done/Blocked), card count headers, priority badges (color-coded), assignee and due date display, blocked indicator, TransitionGroup animations, filter by assignee/view all, empty state per column
- [x] **SvelteKit pages updated** — Inspections page: DataTable with row click → InspectionForm widget; Blueprints page: DataTable with row click → BlueprintViewer widget; Safety page: DataTable with row click → SafetyHeatmap widget; My Tasks page: KanbanBoard widget with create card modal
- [x] **WidgetWrapper.svelte cleaned up** — Removed unused `vueInstance` variable, `ComponentPublicInstance` import, `waitForWidget` import; fixed self-closing div tag
- [x] **SvelteKit build passes** — `pnpm --filter @sitesync/sveltekit build` succeeds
- [x] **Delivery Tracker widget completed with Leaflet map + receipt confirmation** — Leaflet map with truck markers (rotating emoji icons), simulated GPS movement (setInterval 2s), receipt confirmation modal with camera capture (HTML5 file input + capture attribute), canvas-based signature pad (mouse + touch), confirmReceipt mutation integration
- [x] **Deliveries page query fixed** — Removed `status` from `listByProject` args (would cause Convex validation crash), added client-side filtering via `$derived.by()`, fixed create form to include required `materialList` and numeric `eta`

### COMPLETED (Session 3 — DevOps 2026 Overhaul)

- [x] **CI/CD pipeline overhauled** — Concurrency groups with cancel-in-progress; quality checks (Svelte Check, lint, Terraform fmt); security scans (Trivy filesystem + CodeQL); build job (all 5 widgets + SvelteKit); SBOM generation (CycloneDX); multi-arch Docker build (linux/amd64 + arm64) with buildx cache, provenance, and SBOM attestations; Docker image Trivy scan; deploy job (KUBECONFIG + kubectl set image + rollout wait)
- [x] **Dockerfile upgraded** — Multi-stage (deps → builder → runner); non-root user (svelte:1001); HEALTHCHECK (Node.js HTTP); OCI labels (org.opencontainers.image.\*); seccomp profile; readOnlyRootFilesystem; all 5 widgets built in builder stage; BUILD_DATE arg for labels; pnpm prune --prod
- [x] **.dockerignore created** — Excludes node_modules, .git, .env, IDE files, CI artifacts, Docker files
- [x] **Dependabot configured** — npm ecosystems for root (suppressed), SvelteKit, Convex, all 5 widgets; Docker ecosystem; GitHub Actions ecosystem; weekly schedule; grouped updates
- [x] **Pre-commit hooks configured** — trailing-whitespace, end-of-file-fixer, check-yaml, check-added-large-files, check-merge-conflict, detect-private-key; Terraform (fmt, validate, tflint, trivy); secret scanning (detect-secrets + ripsecrets)
- [x] **K8s HPA added** — CPU (60%) and memory (80%) targets; scale-up/down stabilization windows
- [x] **K8s NetworkPolicy added** — Deny-all default ingress; allow ingress from Traefik on 80/443; allow DNS egress (udp 53); allow web egress (tcp 443)
- [x] **K8s PodDisruptionBudget added** — minAvailable: 1 (ensures HA during voluntary disruptions)
- [x] **K8s ServiceAccount + RBAC added** — least-privilege Role (endpoints get/list/watch, pods get/list/watch, services get scoped to sitesync-web) + RoleBinding
- [x] **K8s PrometheusRules added** — HighErrorRate (5% over 5m), HighLatency (p99 > 2s), PodCrashLooping, HighMemoryUsage (> 85%)
- [x] **K8s deployment hardened** — securityContext (runAsNonRoot, fsGroup, seccomp RuntimeDefault); container securityContext (allowPrivilegeEscalation false, cap drop ALL, readOnlyRootFilesystem); startupProbe; topologySpreadConstraints; terminationGracePeriodSeconds; TLS ingress with cert-manager ClusterIssuer
- [x] **Terraform upgraded** — Remote state backend (http for OCI Object Storage); NSG (Network Security Group) rules for SSH/HTTP/HTTPS + egress; DNS zone (oci_dns_zone) + A record; boot volume backup with data source lookup; reserved public IP with instance assignment; hashicorp/setup-terraform action in CI
- [x] **Grafana dashboard provisioning added** — Auto-load dashboard via provisioning/dashboards/dashboards.yaml; datasource UID consistency (prometheus); alerting contact points (email + Slack webhook)
- [x] **Monitoring stack completed** — Prometheus datasource with correct UID; Grafana dashboard provider config; alerting contact points

### COMPLETED (Session 4 — 2026 Premium Upgrade)

- [x] **PWA support** — `manifest.json` with icon set, splash screens, theme color; `service-worker.ts` with cache-first strategy for static assets, stale-while-revalidate for Convex data, offline fallback page; PWA meta tags in `app.html`
- [x] **Notification system** — `convex/functions/notifications/` — `mutations.ts` (createNotification, markRead, markAllRead, dismissNotification, clearAll) + `queries.ts` (listByUser, getUnreadCount); `schema.ts` updated with `notifications` table; `stores/notifications.ts` store with real-time subscription via Convex `onUpdate`, optimistic markRead/markAllRead, `currentUserId` tracking
- [x] **Command palette (Cmd+K)** — `stores/command-palette.ts` store with `isOpen`, `query`, `filtered`, `commands`; `commands.register()`/`unregister()` API; `registerBuiltinCommands()` for page navigation; `CommandPalette.svelte` overlay component with icon groups, keyboard navigation (↑↓↵Esc), filtered search, grouped results, footer hints; `Header.svelte` updated with search button + Cmd+K hint button
- [x] **Responsive mobile layout** — `BottomNav.svelte` component with role-filtered nav items, active state tracking, `safe-area-bottom` class; `app.css` updated with `safe-area-bottom` env() and `page-enter` animation class; `+layout.svelte` updated with desktop Sidebar (hidden on mobile), main content area with `pb-20 md:pb-6`, BottomNav, page transitions (`in:fly={{ y: 8 }}`, `{#key $page.url.pathname}`)
- [x] **NotificationDropdown component** — `NotificationDropdown.svelte` with bell icon + badge, type-specific icons/colors, timeAgo formatting, mark all read button, optimistic read indicators, scrollable list, loading/empty states
- [x] **Users management page** — `routes/app/users/+page.svelte` with admin-only guard, DataTable listing all users, role distribution cards, Create User modal (name, email, role), Edit modal (role change, deactivate), typed `mutation()` helper calls
- [x] **Settings page** — `routes/app/settings/+page.svelte` with Profile section (name/email editable), Appearance section (theme toggle), Notifications preferences (checkbox toggles), one-time init block to fix `state_referenced_locally` warnings
- [x] **Reports & Analytics page** — `routes/app/reports/+page.svelte` with Chart.js bar chart (overview counts), KPI summary cards (active deliveries, pending inspections, active permits, total items), status breakdowns (deliveries/inspections by status with color dots), permits by type, export report buttons, period selector
- [x] **Type-safe Convex helpers** — `utils/convex-types.ts` with full `ConvexMutation`/`ConvexQuery` union types, `MutationArgs`/`QueryArgs` typed maps for all 34+ mutations and 28+ queries, `mutation()` and `onQueryUpdate()` helper functions
- [x] **All `as any` casts removed** — 4 SvelteKit page files (deliveries, blueprints, safety, my-tasks) updated to use typed `mutation()` helper; `stores/notifications.ts` cleaned up; `stores/convex-query.ts` already fixed
- [x] **AI features** — `convex/functions/ai/actions.ts` with `analyzeInspectionPhoto` action (Gemini API integration with graceful fallback to rule-based analysis), `generateTaskSuggestions` action (analyzes inspection results → smart task suggestions with priority and role assignment)
- [x] **Notifications Schema** — `schema.ts` updated with `notifications` table (userId, type, severity, title, message, link, read, createdAt, expiresAt) and indexes
- [x] **chart.js installed** — Added as dependency to @sitesync/sveltekit
- [x] **Build passes** — `pnpm --filter @sitesync/sveltekit build` succeeds

### NOT STARTED

- [ ] Run `npx convex dev` to deploy backend and generate `_generated/` files
- [ ] Set CONVEX_URL, BETTER_AUTH_SECRET, VITE_CONVEX_URL env vars
- [ ] Optimistic update patterns in Vue widgets (useOptimisticMutation)
- [ ] Vitest unit tests: UI components, stores, middleware, validators
- [ ] Playwright E2E: login, CRUD flows for all modules
- [ ] Verify Grafana dashboard loads with real metrics
- [ ] Deploy to OCI via Terraform + ArgoCD
- [ ] Final integration testing across all 5 modules
- [ ] Vue widget `as any` casts (different codebase — needs separate approach)
