import type { Doc } from './_generated/dataModel';

export const ROLES = {
  admin: 'admin',
  projectManager: 'project_manager',
  procurement: 'procurement',
  architect: 'architect',
  fieldEngineer: 'field_engineer',
  hseOfficer: 'hse_officer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

interface AuthCtx {
  auth: { getUserIdentity: () => Promise<any> };
  db: any;
}

export async function requireAuth(ctx: AuthCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthenticated');

  const user = await ctx.db
    .query('users')
    .withIndex('by_email', (q: any) => q.eq('email', identity.email))
    .first();

  if (!user) throw new Error('User not found');
  return user;
}

export async function requireRole(ctx: AuthCtx, allowedRoles: Role[]): Promise<Doc<'users'>> {
  const user = await requireAuth(ctx);
  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error(`Forbidden: requires role ${allowedRoles.join(' or ')}`);
  }
  return user;
}

export function validateDeliveryStatusTransition(current: string, next: string): void {
  const allowed: Record<string, string[]> = {
    ordered: ['dispatched'],
    dispatched: ['in_transit'],
    in_transit: ['on_site'],
    on_site: ['received_inspected'],
    received_inspected: [],
  };

  if (!allowed[current]?.includes(next)) {
    throw new Error(`Invalid status transition: ${current} -> ${next}`);
  }
}
