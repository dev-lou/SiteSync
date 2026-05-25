import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  return {
    user: {
      id: locals.user.id,
      name: locals.user.name || 'User',
      email: locals.user.email || '',
      role: locals.user.role || 'field_engineer',
      avatarUrl: locals.user.image || undefined,
      projectId: locals.user.projectId,
    },
  };
};
