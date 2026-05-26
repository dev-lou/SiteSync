import { redirect } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';

const CONVEX_URL = env.CONVEX_URL || 'https://resilient-lemur-480.convex.site';
export async function getSession(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  try {
    const res = await fetch(`${CONVEX_URL}/api/auth/get-session`, {
      headers: request.headers,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.user) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getCurrentUser(request: Request) {
  const session = await getSession(request);
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    role: session.user.role || 'field_engineer',
    image: session.user.image,
    projectId: session.user.projectId,
  };
}

export function ensureAuth(user: unknown) {
  if (!user) throw redirect(303, '/login');
}
