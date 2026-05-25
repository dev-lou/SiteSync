import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const metrics = [
    '# HELP sitesync_active_users Currently logged-in users',
    '# TYPE sitesync_active_users gauge',
    'sitesync_active_users 0',
    '',
    '# HELP sitesync_open_tasks Tasks not in Done column',
    '# TYPE sitesync_open_tasks gauge',
    'sitesync_open_tasks 0',
    '',
    '# HELP sitesync_expiring_permits Permits expiring within 24h',
    '# TYPE sitesync_expiring_permits gauge',
    'sitesync_expiring_permits 0',
    '',
    '# HELP sitesync_delivery_delay_hours Delivery delay in hours',
    '# TYPE sitesync_delivery_delay_hours histogram',
    'sitesync_delivery_delay_hours_bucket{le="1"} 0',
    'sitesync_delivery_delay_hours_bucket{le="4"} 0',
    'sitesync_delivery_delay_hours_bucket{le="8"} 0',
    'sitesync_delivery_delay_hours_bucket{le="24"} 0',
    'sitesync_delivery_delay_hours_bucket{le="48"} 0',
    'sitesync_delivery_delay_hours_bucket{le="72"} 0',
    'sitesync_delivery_delay_hours_bucket{le="+Inf"} 0',
    'sitesync_delivery_delay_hours_sum 0',
    'sitesync_delivery_delay_hours_count 0',
  ].join('\n');

  return new Response(metrics, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
