import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

const checklistItemSchema = v.object({
  item: v.string(),
  required: v.boolean(),
  passed: v.optional(v.boolean()),
  notes: v.optional(v.string()),
  photoIds: v.optional(v.array(v.string())),
});

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    zoneId: v.optional(v.id('workZones')),
    title: v.string(),
    checklist: v.array(checklistItemSchema),
    assigneeId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.architect]);
    const now = Date.now();

    return await ctx.db.insert('inspections', {
      projectId: args.projectId,
      zoneId: args.zoneId,
      title: args.title,
      checklist: args.checklist.map((item) => ({ ...item })),
      status: 'pending',
      assigneeId: args.assigneeId,
      createdBy: user._id,
      createdAt: now,
      auditTrail: [{
        action: 'created',
        userId: user._id,
        timestamp: now,
        detail: `Inspection "${args.title}" created`,
      }],
    });
  },
});

export const startInspection = mutation({
  args: { inspectionId: v.id('inspections') },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.fieldEngineer, ROLES.architect]);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) throw new Error('Inspection not found');
    if (inspection.status !== 'pending') throw new Error('Inspection already started');

    await ctx.db.patch(args.inspectionId, {
      status: 'in_progress',
      auditTrail: [
        ...inspection.auditTrail,
        { action: 'started', userId: user._id, timestamp: Date.now(), detail: 'Inspection started' },
      ],
    });

    return args.inspectionId;
  },
});

export const updateChecklistItem = mutation({
  args: {
    inspectionId: v.id('inspections'),
    itemIndex: v.number(),
    passed: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    photoIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.fieldEngineer, ROLES.architect]);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    const checklist = [...inspection.checklist];
    if (args.itemIndex < 0 || args.itemIndex >= checklist.length) {
      throw new Error('Invalid checklist item index');
    }

    const item = { ...checklist[args.itemIndex] };
    if (args.passed !== undefined) item.passed = args.passed;
    if (args.notes !== undefined) item.notes = args.notes;
    if (args.photoIds !== undefined) item.photoIds = args.photoIds;
    checklist[args.itemIndex] = item;

    await ctx.db.patch(args.inspectionId, {
      checklist,
      auditTrail: [
        ...inspection.auditTrail,
        {
          action: 'checklist_item_updated',
          userId: user._id,
          timestamp: Date.now(),
          detail: `Item ${args.itemIndex}: ${item.item} updated`,
        },
      ],
    });

    return args.inspectionId;
  },
});

export const completeInspection = mutation({
  args: {
    inspectionId: v.id('inspections'),
    status: v.union(
      v.literal('passed'),
      v.literal('failed'),
      v.literal('remedial'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.fieldEngineer, ROLES.architect]);
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) throw new Error('Inspection not found');

    await ctx.db.patch(args.inspectionId, {
      status: args.status,
      completedAt: Date.now(),
      auditTrail: [
        ...inspection.auditTrail,
        {
          action: 'completed',
          userId: user._id,
          timestamp: Date.now(),
          detail: `Inspection completed as "${args.status}"`,
        },
      ],
    });

    return args.inspectionId;
  },
});
