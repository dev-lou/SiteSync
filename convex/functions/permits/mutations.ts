import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

export const createPermit = mutation({
  args: {
    projectId: v.id('projects'),
    zoneId: v.optional(v.id('workZones')),
    type: v.union(
      v.literal('hot_work'),
      v.literal('confined_space'),
      v.literal('height_work'),
      v.literal('electrical'),
      v.literal('general'),
    ),
    issuedTo: v.id('users'),
    expiresAt: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.hseOfficer]);

    return await ctx.db.insert('permits', {
      projectId: args.projectId,
      zoneId: args.zoneId,
      type: args.type,
      status: 'applied',
      issuedTo: args.issuedTo,
      issuedBy: user._id,
      appliedAt: Date.now(),
      expiresAt: args.expiresAt,
      notes: args.notes,
    });
  },
});

export const activatePermit = mutation({
  args: { permitId: v.id('permits') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.hseOfficer]);
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error('Permit not found');

    await ctx.db.patch(args.permitId, {
      status: 'active',
      activeAt: Date.now(),
    });

    return args.permitId;
  },
});

export const suspendZone = mutation({
  args: {
    zoneId: v.id('workZones'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.hseOfficer]);
    const zone = await ctx.db.get(args.zoneId);
    if (!zone) throw new Error('Zone not found');

    await ctx.db.patch(args.zoneId, {
      status: 'suspended',
      suspendedReason: args.reason,
      suspendedBy: user._id,
      suspendedAt: Date.now(),
    });

    const permits = await ctx.db
      .query('permits')
      .withIndex('by_zone', (q) => q.eq('zoneId', args.zoneId))
      .collect();

    for (const permit of permits) {
      if (permit.status === 'active') {
        await ctx.db.patch(permit._id, {
          status: 'suspended',
          suspendedAt: Date.now(),
        });
      }
    }

    const cards = await ctx.db
      .query('kanbanCards')
      .collect();

    for (const card of cards) {
      if (card.linkedDeliveryId) {
        const delivery = await ctx.db.get(card.linkedDeliveryId);
        if (delivery && delivery.zoneId === args.zoneId) {
          await ctx.db.patch(card._id, {
            status: 'blocked',
            blockedReason: `Zone "${zone.name}" suspended: ${args.reason}`,
          });
        }
      }
      if (card.linkedInspectionId) {
        const inspection = await ctx.db.get(card.linkedInspectionId);
        if (inspection && inspection.zoneId === args.zoneId) {
          await ctx.db.patch(card._id, {
            status: 'blocked',
            blockedReason: `Zone "${zone.name}" suspended: ${args.reason}`,
          });
        }
      }
    }

    return args.zoneId;
  },
});

export const reactivateZone = mutation({
  args: { zoneId: v.id('workZones') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.hseOfficer]);
    const zone = await ctx.db.get(args.zoneId);
    if (!zone) throw new Error('Zone not found');

    await ctx.db.patch(args.zoneId, {
      status: 'active',
      suspendedReason: undefined,
      suspendedBy: undefined,
      suspendedAt: undefined,
    });

    const cards = await ctx.db.query('kanbanCards').collect();
    for (const card of cards) {
      if (card.status === 'blocked' && card.blockedReason?.includes(`"${zone.name}" suspended`)) {
        await ctx.db.patch(card._id, {
          status: 'backlog',
          blockedReason: undefined,
        });
      }
    }

    return args.zoneId;
  },
});

export const revokePermit = mutation({
  args: { permitId: v.id('permits') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.hseOfficer]);
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error('Permit not found');

    await ctx.db.patch(args.permitId, {
      status: 'suspended',
      suspendedAt: Date.now(),
    });

    return args.permitId;
  },
});

export const createZone = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    svgPath: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.hseOfficer]);

    return await ctx.db.insert('workZones', {
      projectId: args.projectId,
      name: args.name,
      svgPath: args.svgPath,
      status: 'active',
    });
  },
});
