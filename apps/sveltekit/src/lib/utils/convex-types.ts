/**
 * Type-safe wrappers for Convex mutation and query calls.
 *
 * Instead of `client.mutation('deliveries:create' as any, {...})`,
 * use `mutation('deliveries:create', {...})` which is fully typed.
 */

import { getConvexClient } from '$stores/convex';
import type { ConvexClient } from 'convex/browser';

// ── Mutation names (known set) ──

export type ConvexMutation =
  | 'deliveries:create'
  | 'deliveries:updateStatus'
  | 'deliveries:confirmReceipt'
  | 'deliveries:updateEta'
  | 'deliveries:remove'
  | 'inspections:create'
  | 'inspections:startInspection'
  | 'inspections:updateChecklistItem'
  | 'inspections:completeInspection'
  | 'blueprints:create'
  | 'blueprints:uploadNewRevision'
  | 'blueprints:updateStatus'
  | 'blueprints:createChangeOrder'
  | 'blueprints:approveChangeOrder'
  | 'permits:createPermit'
  | 'permits:activatePermit'
  | 'permits:suspendZone'
  | 'permits:reactivateZone'
  | 'permits:revokePermit'
  | 'permits:createZone'
  | 'kanban:createBoard'
  | 'kanban:createCard'
  | 'kanban:moveCard'
  | 'kanban:updateCard'
  | 'kanban:deleteCard'
  | 'projects:create'
  | 'projects:addMember'
  | 'projects:updateStatus'
  | 'users:createUser'
  | 'users:updateRole'
  | 'users:deactivateUser'
  | 'notifications:createNotification'
  | 'notifications:markRead'
  | 'notifications:markAllRead'
  | 'notifications:dismissNotification'
  | 'notifications:clearAll';

export type ConvexQuery =
  | 'deliveries:listByProject'
  | 'deliveries:getById'
  | 'deliveries:listByStatus'
  | 'deliveries:getActiveDeliveries'
  | 'deliveries:getDeliveryCounts'
  | 'inspections:listByProject'
  | 'inspections:getById'
  | 'inspections:listByAssignee'
  | 'inspections:getCounts'
  | 'blueprints:listByProject'
  | 'blueprints:getById'
  | 'blueprints:getRevisions'
  | 'blueprints:getLatestRevision'
  | 'blueprints:listChangeOrders'
  | 'permits:listByProject'
  | 'permits:listByZone'
  | 'permits:listExpiring'
  | 'permits:listZonesByProject'
  | 'permits:getZoneById'
  | 'permits:getPermitStats'
  | 'kanban:getBoardByProject'
  | 'kanban:getBoardById'
  | 'kanban:getCardsByBoard'
  | 'kanban:getCardsByColumn'
  | 'kanban:getMyTasks'
  | 'kanban:getCardById'
  | 'projects:list'
  | 'projects:listAll'
  | 'projects:getById'
  | 'projects:listMembers'
  | 'users:me'
  | 'users:list'
  | 'users:getById'
  | 'users:findUsersByRole'
  | 'notifications:listByUser'
  | 'notifications:getUnreadCount';

// ── Mutation args type map ──

export interface MutationArgs {
  'deliveries:create': {
    projectId: string;
    title: string;
    supplier: string;
    materialList: { name: string; quantity: number; unit: string }[];
    eta: number;
  };
  'deliveries:confirmReceipt': {
    deliveryId: string;
    photo?: string;
    signature?: string;
  };
  'deliveries:updateStatus': {
    deliveryId: string;
    newStatus: string;
  };
  'deliveries:updateEta': {
    deliveryId: string;
    eta: number;
  };
  'deliveries:remove': {
    deliveryId: string;
  };
  'inspections:create': {
    projectId: string;
    title: string;
    checklist: { item: string; required: boolean }[];
  };
  'inspections:startInspection': {
    inspectionId: string;
  };
  'inspections:updateChecklistItem': {
    inspectionId: string;
    itemIndex: number;
    passed?: boolean;
    notes?: string;
    photoIds?: string[];
  };
  'inspections:completeInspection': {
    inspectionId: string;
    status: string;
  };
  'blueprints:create': {
    projectId: string;
    title: string;
    description?: string;
  };
  'blueprints:uploadNewRevision': {
    blueprintId: string;
    fileStorageId: string;
    changeLog?: string;
  };
  'blueprints:updateStatus': {
    blueprintId: string;
    newStatus: string;
  };
  'blueprints:createChangeOrder': {
    blueprintId: string;
    projectId: string;
    title: string;
    description: string;
  };
  'blueprints:approveChangeOrder': {
    changeOrderId: string;
  };
  'permits:createPermit': Record<string, unknown>;
  'permits:activatePermit': {
    permitId: string;
  };
  'permits:suspendZone': {
    zoneId: string;
    reason: string;
  };
  'permits:reactivateZone': {
    zoneId: string;
  };
  'permits:revokePermit': {
    permitId: string;
  };
  'permits:createZone': {
    projectId: string;
    name: string;
    svgPath: string;
  };
  'kanban:createBoard': Record<string, unknown>;
  'kanban:createCard': {
    boardId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    priority: string;
  };
  'kanban:moveCard': {
    cardId: string;
    columnId: string;
    order?: number;
  };
  'kanban:updateCard': Record<string, unknown>;
  'kanban:deleteCard': {
    cardId: string;
  };
  'projects:create': Record<string, unknown>;
  'projects:addMember': Record<string, unknown>;
  'projects:updateStatus': Record<string, unknown>;
  'users:createUser': Record<string, unknown>;
  'users:updateRole': Record<string, unknown>;
  'users:deactivateUser': Record<string, unknown>;
  'notifications:createNotification': Record<string, unknown>;
  'notifications:markRead': { notificationId: string };
  'notifications:markAllRead': { userId: string };
  'notifications:dismissNotification': { notificationId: string };
  'notifications:clearAll': { userId: string };
}

// ── Query args type map ──

export interface QueryArgs {
  'deliveries:listByProject': { projectId: string };
  'deliveries:getById': { deliveryId: string };
  'deliveries:listByStatus': { projectId: string; status: string };
  'deliveries:getActiveDeliveries': { projectId: string };
  'deliveries:getDeliveryCounts': { projectId: string };
  'inspections:listByProject': { projectId: string };
  'inspections:getById': { inspectionId: string };
  'inspections:listByAssignee': { assigneeId: string };
  'inspections:getCounts': { projectId: string };
  'blueprints:listByProject': { projectId: string };
  'blueprints:getById': { blueprintId: string };
  'blueprints:getRevisions': { blueprintId: string };
  'blueprints:getLatestRevision': { blueprintId: string };
  'blueprints:listChangeOrders': { projectId: string };
  'permits:listByProject': { projectId: string };
  'permits:listByZone': { zoneId: string };
  'permits:listExpiring': { hoursThreshold?: number };
  'permits:listZonesByProject': { projectId: string };
  'permits:getZoneById': { zoneId: string };
  'permits:getPermitStats': { projectId: string };
  'kanban:getBoardByProject': { projectId: string };
  'kanban:getBoardById': { boardId: string };
  'kanban:getCardsByBoard': { boardId: string };
  'kanban:getCardsByColumn': { boardId: string; columnId: string };
  'kanban:getMyTasks': { userId: string; projectId: string };
  'kanban:getCardById': { cardId: string };
  'projects:list': Record<string, never>;
  'projects:listAll': Record<string, never>;
  'projects:getById': { projectId: string };
  'projects:listMembers': { projectId: string };
  'users:me': Record<string, never>;
  'users:list': Record<string, never>;
  'users:getById': { userId: string };
  'users:findUsersByRole': { role: string };
  'notifications:listByUser': { userId: string };
  'notifications:getUnreadCount': { userId: string };
}

// ── Result types ──

export type MutationResult<N extends ConvexMutation> = N extends 'deliveries:create'
  ? string
  : N extends 'notifications:markRead'
    ? string
    : N extends 'notifications:markAllRead'
      ? number
      : unknown;

export type QueryResult<N extends ConvexQuery> = unknown;

// ── Helper functions ──

function resolveName(name: string, type: 'queries' | 'mutations'): string {
  const parts = name.split(':');
  if (parts.length !== 2) return name;
  return `${parts[0]}/${type}:${parts[1]}`;
}

/** Type-safe mutation caller */
export async function mutation<N extends ConvexMutation>(
  name: N,
  args: MutationArgs[N],
  client?: ConvexClient,
): Promise<MutationResult<N>> {
  const c = client ?? getConvexClient();
  const realName = resolveName(name as string, 'mutations');
  return c.mutation(realName as any, args as Record<string, unknown>) as Promise<MutationResult<N>>;
}

/** Type-safe query subscription setup */
export function onQueryUpdate<N extends ConvexQuery>(
  name: N,
  args: QueryArgs[N],
  callback: (result: QueryResult<N>) => void,
): () => void {
  const client = getConvexClient();
  const realName = resolveName(name as string, 'queries');
  return client.onUpdate(realName as any, args as Record<string, unknown>, (result: unknown) => {
    callback(result as QueryResult<N>);
  });
}
