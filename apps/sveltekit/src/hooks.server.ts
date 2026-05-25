import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const publicRoutes = ['/login', '/register', '/api/auth', '/auth', '/metrics', '/health'];

export const handle: Handle = async ({ event, resolve }) => {
  const isPublic = publicRoutes.some((r) => event.url.pathname.startsWith(r));

  if (event.locals.auth) {
    try {
      const session = await event.locals.auth();
      if (session?.user) {
        event.locals.user = session.user;
      }
    } catch {
      // Auth check failed, treat as unauthenticated
    }
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
