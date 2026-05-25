import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../middleware';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const memberships = await ctx.db
      .query('projectMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const projectIds = memberships.map((m) => m.projectId);
    const projects = await Promise.all(
      projectIds.map((id) => ctx.db.get(id)),
    );

    return projects.filter(Boolean);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query('projects').order('desc').collect();
  },
});

export const getById = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.projectId);
  },
});

export const listMembers = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const members = await ctx.db
      .query('projectMembers')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    return await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user: user ? { name: user.name, email: user.email, role: user.role } : null };
      }),
    );
  },
});
