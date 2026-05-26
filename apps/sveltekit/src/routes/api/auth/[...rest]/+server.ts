import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

/**
 * Convex HTTP actions are served on the .convex.site domain.
 * VITE_CONVEX_URL uses .convex.cloud (the API/data domain).
 * We derive the .site URL from it.
 */
function resolveConvexUrl(): string {
  if (process.env.CONVEX_URL) return process.env.CONVEX_URL;
  const viteUrl = process.env.VITE_CONVEX_URL;
  if (viteUrl) return viteUrl.replace('.convex.cloud', '.convex.site');
  return 'http://localhost:3210';
}

const CONVEX_URL = resolveConvexUrl();

async function proxy(event: RequestEvent, method: string) {
  const url = new URL(event.request.url);
  const convexPath = url.pathname.replace(/^\/api\/auth/, '/api/auth');
  const convexUrl = `${CONVEX_URL}${convexPath}${url.search}`;

  const body = method === 'GET' || method === 'HEAD' ? undefined : await event.request.text();

  // Build headers to forward
  const headers: Record<string, string> = {
    'content-type': event.request.headers.get('content-type') || 'application/json',
    cookie: event.request.headers.get('cookie') || '',
    accept: event.request.headers.get('accept') || 'application/json',
  };

  let res: Response;
  try {
    res = await fetch(convexUrl, { method, headers, body, redirect: 'manual' });
  } catch (err) {
    const errObj = err instanceof Error ? err : new Error(String(err));
    const cause =
      errObj.cause instanceof Error ? errObj.cause.message : JSON.stringify(errObj.cause);
    throw error(502, `Auth proxy failed: ${errObj.message} / cause: ${cause}`);
  }

  // Read response body
  let text: string;
  try {
    text = await res.text();
  } catch {
    text = '';
  }

  // Forward set-cookie headers
  const responseHeaders: Record<string, string> = {
    'content-type': res.headers.get('content-type') || 'application/json',
  };
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    responseHeaders['set-cookie'] = setCookie;
  }

  return new Response(text, { status: res.status, headers: responseHeaders });
}

export async function POST(event: RequestEvent) {
  return proxy(event, 'POST');
}
export async function GET(event: RequestEvent) {
  return proxy(event, 'GET');
}
export async function PUT(event: RequestEvent) {
  return proxy(event, 'PUT');
}
export async function DELETE(event: RequestEvent) {
  return proxy(event, 'DELETE');
}
export async function PATCH(event: RequestEvent) {
  return proxy(event, 'PATCH');
}
