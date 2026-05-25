import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, validateDeliveryStatusTransition, ROLES } from '../middleware';

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    zoneId: v.optional(v.id('workZones')),
    title: v.string(),
    supplier: v.string(),
    materialList: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      unit: v.string(),
    })),
    eta: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.procurement]);
    const now = Date.now();

    return await ctx.db.insert('deliveries', {
      projectId: args.projectId,
      zoneId: args.zoneId,
      title: args.title,
      supplier: args.supplier,
      materialList: args.materialList,
      status: 'ordered',
      eta: args.eta,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      updatedBy: user._id,
    });
  },
});

export const updateStatus = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    status: v.union(
      v.literal('ordered'),
      v.literal('dispatched'),
      v.literal('in_transit'),
      v.literal('on_site'),
      v.literal('received_inspected'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.procurement, ROLES.projectManager]);
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    validateDeliveryStatusTransition(delivery.status, args.status);

    await ctx.db.patch(args.deliveryId, {
      status: args.status,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return args.deliveryId;
  },
});

export const confirmReceipt = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    receiptPhoto: v.optional(v.string()),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.fieldEngineer]);
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    if (delivery.status !== 'on_site') {
      throw new Error('Delivery must be "on_site" before confirming receipt');
    }

    await ctx.db.patch(args.deliveryId, {
      status: 'received_inspected',
      receiptPhoto: args.receiptPhoto,
      signature: args.signature,
      receivedBy: user._id,
      actualArrival: Date.now(),
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return args.deliveryId;
  },
});

export const updateEta = mutation({
  args: {
    deliveryId: v.id('deliveries'),
    eta: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.procurement]);
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    await ctx.db.patch(args.deliveryId, {
      eta: args.eta,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return args.deliveryId;
  },
});

export const remove = mutation({
  args: { deliveryId: v.id('deliveries') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin]);
    await ctx.db.delete(args.deliveryId);
    return args.deliveryId;
  },
});
