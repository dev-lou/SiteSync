import { internalMutation } from '../_generated/server';

export const generateDailyLogs = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const today: string = new Date().toISOString().split('T')[0] as string;
    const startOfDay = new Date(today).getTime();
    const endOfDay = startOfDay + 86400000;

    const projects = await ctx.db.query('projects').collect();

    for (const project of projects) {
      if (project.status !== 'active') continue;

      const allCards = await ctx.db.query('kanbanCards').collect();
      const projectCards = allCards.filter((c) => {
        const updated = c.updatedAt >= startOfDay && c.updatedAt < endOfDay;
        return updated;
      });

      const allDeliveries = await ctx.db
        .query('deliveries')
        .withIndex('by_project', (q) => q.eq('projectId', project._id))
        .collect();
      const receivedToday = allDeliveries.filter(
        (d) => d.actualArrival && d.actualArrival >= startOfDay && d.actualArrival < endOfDay,
      );

      const allInspections = await ctx.db
        .query('inspections')
        .withIndex('by_project', (q) => q.eq('projectId', project._id))
        .collect();
      const completedToday = allInspections.filter(
        (i) => i.completedAt && i.completedAt >= startOfDay && i.completedAt < endOfDay,
      );

      const allPermits = await ctx.db.query('permits').collect();
      const projectPermits = allPermits.filter((p) => p.projectId === project._id);
      const expiringSoon = projectPermits.filter(
        (p) => p.status === 'active' && p.expiresAt > now && p.expiresAt < now + 86400000,
      );

      const existingLog = await ctx.db
        .query('dailyLogs')
        .withIndex('by_project_date', (q) => q.eq('projectId', project._id).eq('date', today))
        .first();

      const logEntry = {
        projectId: project._id,
        date: today,
        summary: `Daily summary for ${project.name} — ${today}`,
        taskMovements: projectCards.map((c) => ({
          cardId: c._id,
          fromColumn: 'unknown',
          toColumn: c.columnId,
          timestamp: c.updatedAt,
        })),
        deliveriesReceived: receivedToday.map((d) => d._id),
        inspectionsCompleted: completedToday.map((i) => i._id),
        permitsExpiring: expiringSoon.map((p) => p._id),
        generatedAt: now,
      };

      if (existingLog) {
        await ctx.db.patch(existingLog._id, logEntry);
      } else {
        await ctx.db.insert('dailyLogs', logEntry);
      }
    }

    return {
      projectsProcessed: projects.filter((p) => p.status === 'active').length,
    } as const;
  },
});
