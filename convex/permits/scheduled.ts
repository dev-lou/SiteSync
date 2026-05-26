import { internalMutation } from '../_generated/server';

export const expirePermits = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const permits = await ctx.db.query('permits').collect();
    const activePermits = permits.filter((p) => p.status === 'active' && p.expiresAt <= now);

    for (const permit of activePermits) {
      await ctx.db.patch(permit._id, { status: 'expired' });
    }

    return { expired: activePermits.length } as const;
  },
});
