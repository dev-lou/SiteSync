import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../middleware';

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('deliveries')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect();
  },
});

export const getById = query({
  args: { deliveryId: v.id('deliveries') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.deliveryId);
  },
});

export const listByStatus = query({
  args: { projectId: v.id('projects'), status: v.union(
    v.literal('ordered'),
    v.literal('dispatched'),
    v.literal('in_transit'),
    v.literal('on_site'),
    v.literal('received_inspected'),
  ) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('deliveries')
      .withIndex('by_project_status', (q) =>
        q.eq('projectId', args.projectId).eq('status', args.status),
      )
      .collect();
  },
});

export const getActiveDeliveries = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const deliveries = await ctx.db
      .query('deliveries')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
    return deliveries.filter((d) => d.status !== 'received_inspected');
  },
});

export const getDeliveryCounts = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const deliveries = await ctx.db
      .query('deliveries')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    return {
      total: deliveries.length,
      ordered: deliveries.filter((d) => d.status === 'ordered').length,
      dispatched: deliveries.filter((d) => d.status === 'dispatched').length,
      inTransit: deliveries.filter((d) => d.status === 'in_transit').length,
      onSite: deliveries.filter((d) => d.status === 'on_site').length,
      received: deliveries.filter((d) => d.status === 'received_inspected').length,
    };
  },
});
