import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    address: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin]);

    const projectId = await ctx.db.insert('projects', {
      ...args,
      status: 'active',
      createdBy: user._id,
    });

    await ctx.db.insert('projectMembers', {
      projectId,
      userId: user._id,
      role: 'owner',
    });

    return projectId;
  },
});

export const addMember = mutation({
  args: {
    projectId: v.id('projects'),
    userId: v.id('users'),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);

    return await ctx.db.insert('projectMembers', {
      projectId: args.projectId,
      userId: args.userId,
      role: args.role,
    });
  },
});

export const updateStatus = mutation({
  args: {
    projectId: v.id('projects'),
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('on_hold'),
      v.literal('cancelled'),
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin]);

    await ctx.db.patch(args.projectId, { status: args.status });
    return args.projectId;
  },
});
