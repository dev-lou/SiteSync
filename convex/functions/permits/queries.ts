import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../middleware';

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('permits')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect();
  },
});

export const listByZone = query({
  args: { zoneId: v.id('workZones') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('permits')
      .withIndex('by_zone', (q) => q.eq('zoneId', args.zoneId))
      .collect();
  },
});

export const listExpiring = query({
  args: { withinMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const now = Date.now();
    const window = args.withinMs ?? 24 * 60 * 60 * 1000;
    const all = await ctx.db.query('permits').collect();
    return all.filter(
      (p) => p.status === 'active' && p.expiresAt > now && p.expiresAt < now + window,
    );
  },
});

export const listZonesByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('workZones')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

export const getZoneById = query({
  args: { zoneId: v.id('workZones') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.zoneId);
  },
});

export const getPermitStats = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const permits = await ctx.db.query('permits').collect();
    const projectPermits = permits.filter((p) => p.projectId === args.projectId);

    return {
      total: projectPermits.length,
      active: projectPermits.filter((p) => p.status === 'active').length,
      applied: projectPermits.filter((p) => p.status === 'applied').length,
      expired: projectPermits.filter((p) => p.status === 'expired').length,
      suspended: projectPermits.filter((p) => p.status === 'suspended').length,
      expiringSoon: projectPermits.filter(
        (p) => p.status === 'active' && p.expiresAt < Date.now() + 86400000,
      ).length,
    };
  },
});
