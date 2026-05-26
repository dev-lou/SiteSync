import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json(
    { status: 'ok', timestamp: Date.now(), uptime: process.uptime() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    },
  );
};

export const HEAD: RequestHandler = async () => {
  return new Response(null, { status: 200 });
};
