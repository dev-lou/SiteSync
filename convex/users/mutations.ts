import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('project_manager'),
      v.literal('procurement'),
      v.literal('architect'),
      v.literal('field_engineer'),
      v.literal('hse_officer'),
    ),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin]);
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existing) throw new Error('User with this email already exists');

    return await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      role: args.role,
      phone: args.phone,
      isActive: true,
    });
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(
      v.literal('admin'),
      v.literal('project_manager'),
      v.literal('procurement'),
      v.literal('architect'),
      v.literal('field_engineer'),
      v.literal('hse_officer'),
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin]);
    await ctx.db.patch(args.userId, { role: args.role });
    return args.userId;
  },
});

export const deactivateUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin]);
    await ctx.db.patch(args.userId, { isActive: false });
    return args.userId;
  },
});
