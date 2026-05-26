import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth, requireRole, ROLES } from '../middleware';

export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return user;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, [ROLES.admin]);
    return await ctx.db.query('users').collect();
  },
});

export const getById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.userId);
  },
});

export const findUsersByRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const all = await ctx.db.query('users').collect();
    return all.filter((u) => u.role === args.role && u.isActive);
  },
});
