import { Request } from 'express';

/**
 * Résout l'organisation (tenant) ciblée par une requête authentifiée.
 *
 * - Cas normal : l'utilisateur est rattaché à une organisation (`req.user.organizationId`).
 * - ADMIN sans organisation : peut cibler une org via `?organizationId=...`.
 *
 * Lève une erreur 400 si aucune organisation ne peut être déterminée.
 */
export function resolveOrgId(req: Request): string {
  const fromUser = req.user?.organizationId ?? undefined;
  const fromQuery =
    typeof req.query['organizationId'] === 'string' ? req.query['organizationId'] : undefined;
  const orgId = fromUser ?? fromQuery;
  if (!orgId) {
    const error = new Error('organizationId is required (user has no organization)');
    Object.assign(error, { statusCode: 400 });
    throw error;
  }
  return orgId;
}
