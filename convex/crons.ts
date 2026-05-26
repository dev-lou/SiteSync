import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('expire-permits', { hours: 1 }, internal.permits.scheduled.expirePermits);
crons.interval(
  'generate-daily-logs',
  { hours: 24 },
  internal.dailyLogs.scheduled.generateDailyLogs,
);

export default crons;
