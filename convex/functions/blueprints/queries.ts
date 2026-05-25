import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../middleware';

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('blueprints')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect();
  },
});

export const getById = query({
  args: { blueprintId: v.id('blueprints') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.blueprintId);
  },
});

export const getRevisions = query({
  args: { blueprintId: v.id('blueprints') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('blueprintRevisions')
      .withIndex('by_blueprint', (q) => q.eq('blueprintId', args.blueprintId))
      .order('desc')
      .collect();
  },
});

export const getLatestRevision = query({
  args: { blueprintId: v.id('blueprints') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('blueprintRevisions')
      .withIndex('by_blueprint', (q) => q.eq('blueprintId', args.blueprintId))
      .order('desc')
      .first();
  },
});

export const listChangeOrders = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('changeOrders')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect();
  },
});
