import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../middleware';

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('inspections')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .order('desc')
      .collect();
  },
});

export const getById = query({
  args: { inspectionId: v.id('inspections') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.inspectionId);
  },
});

export const listByAssignee = query({
  args: { assigneeId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('inspections')
      .withIndex('by_assignee', (q) => q.eq('assigneeId', args.assigneeId))
      .collect();
  },
});

export const getCounts = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const inspections = await ctx.db
      .query('inspections')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    return {
      total: inspections.length,
      pending: inspections.filter((i) => i.status === 'pending').length,
      inProgress: inspections.filter((i) => i.status === 'in_progress').length,
      passed: inspections.filter((i) => i.status === 'passed').length,
      failed: inspections.filter((i) => i.status === 'failed').length,
      remedial: inspections.filter((i) => i.status === 'remedial').length,
    };
  },
});
