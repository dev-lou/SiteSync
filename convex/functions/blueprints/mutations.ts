import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    description: v.optional(v.string()),
    fileStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.architect]);
    const now = Date.now();

    const blueprintId = await ctx.db.insert('blueprints', {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      currentRevision: 1,
      status: 'draft',
      createdBy: user._id,
      createdAt: now,
    });

    await ctx.db.insert('blueprintRevisions', {
      blueprintId,
      revisionNumber: 1,
      fileStorageId: args.fileStorageId,
      uploadedBy: user._id,
      uploadedAt: now,
    });

    return blueprintId;
  },
});

export const uploadNewRevision = mutation({
  args: {
    blueprintId: v.id('blueprints'),
    fileStorageId: v.string(),
    changeLog: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.architect]);
    const blueprint = await ctx.db.get(args.blueprintId);
    if (!blueprint) throw new Error('Blueprint not found');

    const newRevisionNumber = blueprint.currentRevision + 1;

    await ctx.db.insert('blueprintRevisions', {
      blueprintId: args.blueprintId,
      revisionNumber: newRevisionNumber,
      fileStorageId: args.fileStorageId,
      uploadedBy: user._id,
      changeLog: args.changeLog,
      uploadedAt: Date.now(),
    });

    await ctx.db.patch(args.blueprintId, {
      currentRevision: newRevisionNumber,
    });

    return args.blueprintId;
  },
});

export const updateStatus = mutation({
  args: {
    blueprintId: v.id('blueprints'),
    status: v.union(
      v.literal('draft'),
      v.literal('in_review'),
      v.literal('approved'),
      v.literal('for_construction'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.architect]);
    const blueprint = await ctx.db.get(args.blueprintId);
    if (!blueprint) throw new Error('Blueprint not found');

    await ctx.db.patch(args.blueprintId, {
      status: args.status,
    });

    return args.blueprintId;
  },
});

export const createChangeOrder = mutation({
  args: {
    blueprintId: v.id('blueprints'),
    projectId: v.id('projects'),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.architect]);

    return await ctx.db.insert('changeOrders', {
      blueprintId: args.blueprintId,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: 'proposed',
      requestedBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const approveChangeOrder = mutation({
  args: { changeOrderId: v.id('changeOrders') },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);
    const co = await ctx.db.get(args.changeOrderId);
    if (!co) throw new Error('Change order not found');

    await ctx.db.patch(args.changeOrderId, {
      status: 'approved',
      approvedBy: user._id,
      approvedAt: Date.now(),
    });

    return args.changeOrderId;
  },
});
