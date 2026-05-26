import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../middleware';

export const getBoardByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('kanbanBoards')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .first();
  },
});

export const getBoardById = query({
  args: { boardId: v.id('kanbanBoards') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.boardId);
  },
});

export const getCardsByBoard = query({
  args: { boardId: v.id('kanbanBoards') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('kanbanCards')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .order('asc')
      .collect();
  },
});

export const getCardsByColumn = query({
  args: { boardId: v.id('kanbanBoards'), columnId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query('kanbanCards')
      .withIndex('by_column', (q) => q.eq('boardId', args.boardId).eq('columnId', args.columnId))
      .order('asc')
      .collect();
  },
});

export const getMyTasks = query({
  args: { userId: v.id('users'), projectId: v.optional(v.id('projects')) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const cards = await ctx.db
      .query('kanbanCards')
      .withIndex('by_assignee', (q) => q.eq('assigneeId', args.userId))
      .collect();
    if (args.projectId) {
      return cards.filter((c) => String(c.boardId) === String(args.projectId));
    }
    return cards;
  },
});

export const getCardById = query({
  args: { cardId: v.id('kanbanCards') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.cardId);
  },
});
