import { cronJobs } from 'convex/server';
import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

const crons = cronJobs();

crons.interval('expire-permits', { hours: 1 }, {
  handler: 'permits/scheduled:expirePermits',
});

export default crons;

export const expirePermits = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const permits = await ctx.db.query('permits').collect();
    const activePermits = permits.filter(
      (p) => p.status === 'active' && p.expiresAt <= now,
    );

    for (const permit of activePermits) {
      await ctx.db.patch(permit._id, { status: 'expired' });
    }

    return { expired: activePermits.length };
  },
});
