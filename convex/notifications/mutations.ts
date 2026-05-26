import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

export const createNotification = mutation({
  args: {
    userId: v.id('users'),
    type: v.union(
      v.literal('delivery'),
      v.literal('inspection'),
      v.literal('permit'),
      v.literal('blueprint'),
      v.literal('task'),
      v.literal('system'),
    ),
    severity: v.union(
      v.literal('info'),
      v.literal('warning'),
      v.literal('error'),
      v.literal('success'),
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);

    const now = Date.now();
    return await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      severity: args.severity,
      title: args.title,
      message: args.message,
      link: args.link,
      read: false,
      createdAt: now,
      expiresAt: args.expiresAt,
    });
  },
});

export const markRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error('Notification not found');

    await ctx.db.patch(args.notificationId, { read: true });
    return args.notificationId;
  },
});

export const markAllRead = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('read'), false))
      .collect();

    for (const n of notifications) {
      await ctx.db.patch(n._id, { read: true });
    }

    return notifications.length;
  },
});

export const dismissNotification = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return args.notificationId;
  },
});

export const clearAll = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    return notifications.length;
  },
});
