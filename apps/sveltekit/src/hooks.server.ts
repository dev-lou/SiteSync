import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/server/auth';

const publicRoutes = ['/login', '/register', '/api/auth', '/auth', '/metrics', '/health'];

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = async () => {
    const user = await getCurrentUser(event.request);
    if (!user) return null;
    return { user };
  };

  const isPublic = publicRoutes.some((r) => event.url.pathname.startsWith(r));

  try {
    const session = await event.locals.auth();
    if (session?.user) {
      event.locals.user = session.user;
    }
  } catch {
    // Auth check failed, treat as unauthenticated
  }

  if (!isPublic && !event.locals.user) {
    throw redirect(303, '/login');
  }

  if (isPublic && event.locals.user && event.url.pathname === '/login') {
    throw redirect(303, '/app');
  }

  const response = await resolve(event);
  return response;
};
