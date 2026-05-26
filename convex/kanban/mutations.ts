import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireRole, ROLES } from '../middleware';

export const createBoard = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    columns: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);

    return await ctx.db.insert('kanbanBoards', {
      projectId: args.projectId,
      title: args.title,
      columns: args.columns,
      createdBy: user._id,
    });
  },
});

export const createCard = mutation({
  args: {
    boardId: v.id('kanbanBoards'),
    columnId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id('users')),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical'),
    ),
    dueDate: v.optional(v.number()),
    linkedDeliveryId: v.optional(v.id('deliveries')),
    linkedInspectionId: v.optional(v.id('inspections')),
    linkedBlueprintId: v.optional(v.id('blueprints')),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);
    const now = Date.now();

    const existingCards = await ctx.db
      .query('kanbanCards')
      .withIndex('by_column', (q) => q.eq('boardId', args.boardId).eq('columnId', args.columnId))
      .collect();

    const maxOrder = existingCards.reduce((max, c) => Math.max(max, c.order), 0);

    return await ctx.db.insert('kanbanCards', {
      boardId: args.boardId,
      columnId: args.columnId,
      title: args.title,
      description: args.description,
      assigneeId: args.assigneeId,
      priority: args.priority,
      status: mapColumnToStatus(args.columnId),
      order: maxOrder + 1,
      linkedDeliveryId: args.linkedDeliveryId,
      linkedInspectionId: args.linkedInspectionId,
      linkedBlueprintId: args.linkedBlueprintId,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const moveCard = mutation({
  args: {
    cardId: v.id('kanbanCards'),
    columnId: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.projectManager, ROLES.fieldEngineer]);
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error('Card not found');

    const board = await ctx.db.get(card.boardId);
    if (!board) throw new Error('Board not found');

    const targetColumn = board.columns.find((c) => c.id === args.columnId);
    if (!targetColumn) throw new Error('Invalid column');

    const now = Date.now();

    await ctx.db.patch(args.cardId, {
      columnId: args.columnId,
      order: args.order,
      status: mapColumnToStatus(args.columnId),
      updatedAt: now,
    });

    return args.cardId;
  },
});

export const updateCard = mutation({
  args: {
    cardId: v.id('kanbanCards'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id('users')),
    priority: v.optional(
      v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('critical')),
    ),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);
    const card = await ctx.db.get(args.cardId);
    if (!card) throw new Error('Card not found');

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.assigneeId !== undefined) updates.assigneeId = args.assigneeId;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

    await ctx.db.patch(args.cardId, updates);
    return args.cardId;
  },
});

export const deleteCard = mutation({
  args: { cardId: v.id('kanbanCards') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [ROLES.admin, ROLES.projectManager]);
    await ctx.db.delete(args.cardId);
    return args.cardId;
  },
});

function mapColumnToStatus(
  columnId: string,
): 'backlog' | 'ready' | 'in_progress' | 'qc' | 'done' | 'blocked' {
  switch (columnId) {
    case 'backlog':
      return 'backlog';
    case 'ready':
      return 'ready';
    case 'in_progress':
      return 'in_progress';
    case 'qc':
      return 'qc';
    case 'done':
      return 'done';
    default:
      return 'backlog';
  }
}
