import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const userRoles = v.union(
  v.literal('admin'),
  v.literal('project_manager'),
  v.literal('procurement'),
  v.literal('architect'),
  v.literal('field_engineer'),
  v.literal('hse_officer'),
);

const deliveryStatus = v.union(
  v.literal('ordered'),
  v.literal('dispatched'),
  v.literal('in_transit'),
  v.literal('on_site'),
  v.literal('received_inspected'),
);

const inspectionStatus = v.union(
  v.literal('pending'),
  v.literal('in_progress'),
  v.literal('passed'),
  v.literal('failed'),
  v.literal('remedial'),
);

const blueprintStatus = v.union(
  v.literal('draft'),
  v.literal('in_review'),
  v.literal('approved'),
  v.literal('for_construction'),
);

const permitStatus = v.union(
  v.literal('applied'),
  v.literal('active'),
  v.literal('expired'),
  v.literal('suspended'),
);

const permitType = v.union(
  v.literal('hot_work'),
  v.literal('confined_space'),
  v.literal('height_work'),
  v.literal('electrical'),
  v.literal('general'),
);

const zoneStatus = v.union(v.literal('active'), v.literal('suspended'), v.literal('completed'));

const cardStatus = v.union(
  v.literal('backlog'),
  v.literal('ready'),
  v.literal('in_progress'),
  v.literal('qc'),
  v.literal('done'),
  v.literal('blocked'),
);

const changeOrderStatus = v.union(
  v.literal('proposed'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('implemented'),
);

export default defineSchema({
  // ── Auth / Users ──
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: userRoles,
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
  }).index('by_email', ['email']),

  // ── Projects ──
  projects: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    address: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('on_hold'),
      v.literal('cancelled'),
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    createdBy: v.id('users'),
  }).index('by_status', ['status']),

  projectMembers: defineTable({
    projectId: v.id('projects'),
    userId: v.id('users'),
    role: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_user', ['userId']),

  // ── Module 1: Deliveries ──
  deliveries: defineTable({
    projectId: v.id('projects'),
    zoneId: v.optional(v.id('workZones')),
    title: v.string(),
    supplier: v.string(),
    materialList: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
      }),
    ),
    status: deliveryStatus,
    eta: v.number(),
    actualArrival: v.optional(v.number()),
    notes: v.optional(v.string()),
    receiptPhoto: v.optional(v.string()),
    signature: v.optional(v.string()),
    receivedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.id('users'),
  })
    .index('by_project', ['projectId'])
    .index('by_status', ['status'])
    .index('by_project_status', ['projectId', 'status']),

  // ── Module 2: Inspections ──
  inspections: defineTable({
    projectId: v.id('projects'),
    zoneId: v.optional(v.id('workZones')),
    title: v.string(),
    checklist: v.array(
      v.object({
        item: v.string(),
        required: v.boolean(),
        passed: v.optional(v.boolean()),
        notes: v.optional(v.string()),
        photoIds: v.optional(v.array(v.string())),
      }),
    ),
    status: inspectionStatus,
    assigneeId: v.optional(v.id('users')),
    createdBy: v.id('users'),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    auditTrail: v.array(
      v.object({
        action: v.string(),
        userId: v.id('users'),
        timestamp: v.number(),
        detail: v.optional(v.string()),
      }),
    ),
  })
    .index('by_project', ['projectId'])
    .index('by_status', ['status'])
    .index('by_assignee', ['assigneeId']),

  // ── Module 3: Blueprints ──
  blueprints: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    description: v.optional(v.string()),
    currentRevision: v.number(),
    status: blueprintStatus,
    createdBy: v.id('users'),
    createdAt: v.number(),
  }).index('by_project', ['projectId']),

  blueprintRevisions: defineTable({
    blueprintId: v.id('blueprints'),
    revisionNumber: v.number(),
    fileStorageId: v.string(),
    fileUrl: v.optional(v.string()),
    uploadedBy: v.id('users'),
    changeLog: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index('by_blueprint', ['blueprintId'])
    .index('by_blueprint_revision', ['blueprintId', 'revisionNumber']),

  changeOrders: defineTable({
    blueprintId: v.id('blueprints'),
    projectId: v.id('projects'),
    title: v.string(),
    description: v.string(),
    status: changeOrderStatus,
    requestedBy: v.id('users'),
    approvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index('by_blueprint', ['blueprintId'])
    .index('by_project', ['projectId']),

  // ── Module 4: Safety ──
  workZones: defineTable({
    projectId: v.id('projects'),
    name: v.string(),
    svgPath: v.string(),
    status: zoneStatus,
    suspendedReason: v.optional(v.string()),
    suspendedBy: v.optional(v.id('users')),
    suspendedAt: v.optional(v.number()),
  })
    .index('by_project', ['projectId'])
    .index('by_status', ['status']),

  permits: defineTable({
    projectId: v.id('projects'),
    zoneId: v.optional(v.id('workZones')),
    type: permitType,
    status: permitStatus,
    issuedTo: v.id('users'),
    issuedBy: v.optional(v.id('users')),
    appliedAt: v.number(),
    activeAt: v.optional(v.number()),
    expiresAt: v.number(),
    suspendedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index('by_project', ['projectId'])
    .index('by_zone', ['zoneId'])
    .index('by_status', ['status'])
    .index('by_expiry', ['expiresAt']),

  // ── Module 5: Kanban ──
  kanbanBoards: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    columns: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        order: v.number(),
      }),
    ),
    createdBy: v.id('users'),
  }).index('by_project', ['projectId']),

  kanbanCards: defineTable({
    boardId: v.id('kanbanBoards'),
    columnId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id('users')),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical'),
    ),
    status: cardStatus,
    order: v.number(),
    linkedDeliveryId: v.optional(v.id('deliveries')),
    linkedInspectionId: v.optional(v.id('inspections')),
    linkedBlueprintId: v.optional(v.id('blueprints')),
    blockedReason: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_board', ['boardId'])
    .index('by_column', ['boardId', 'columnId'])
    .index('by_assignee', ['assigneeId']),

  // ── Daily Logs ──
  dailyLogs: defineTable({
    projectId: v.id('projects'),
    date: v.string(),
    summary: v.string(),
    taskMovements: v.array(
      v.object({
        cardId: v.id('kanbanCards'),
        fromColumn: v.string(),
        toColumn: v.string(),
        timestamp: v.number(),
      }),
    ),
    deliveriesReceived: v.array(v.id('deliveries')),
    inspectionsCompleted: v.array(v.id('inspections')),
    permitsExpiring: v.array(v.id('permits')),
    generatedAt: v.number(),
  }).index('by_project_date', ['projectId', 'date']),

  // ── Notifications ──
  notifications: defineTable({
    userId: v.id('users'),
    type: v.union(
      v.literal('delivery'),
      v.literal('inspection'),
      v.literal('permit'),
      v.literal('blueprint'),
      v.literal('task'),
      v.literal('system'),
    ),
    severity: v.union(
      v.literal('info'),
      v.literal('warning'),
      v.literal('error'),
      v.literal('success'),
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_read', ['userId', 'read']),

  // ── Presence ──
  presence: defineTable({
    user: v.id('users'),
    resourceType: v.string(),
    resourceId: v.string(),
    updatedAt: v.number(),
  })
    .index('by_resource', ['resourceType', 'resourceId'])
    .index('by_user', ['user']),
});
