import express, { type Response } from 'express';
import { validateMutationEnvelope } from '@odd-tower/network-protocol';
import type { AuthVerifier } from '../auth/AuthVerifier.js';
import { authMiddleware, type AuthenticatedRequest } from '../auth/authMiddleware.js';
import type { ActiveUserRegistry } from '../auth/ActiveUserRegistry.js';
import type { PlayerPersistenceService } from '../persistence/persistence-types.js';
import type { PersistenceHealth } from '../persistence/PersistenceHealth.js';
import { DomainError, mapPersistenceError, safeMessage } from './domainErrors.js';
import { ApiRateLimiter } from './apiRateLimiter.js';

type Dependencies = {
  authVerifier: AuthVerifier;
  persistence: PlayerPersistenceService;
  activeUsers: ActiveUserRegistry;
  health: PersistenceHealth;
};

export function createPlayerRouter(dependencies: Dependencies) {
  const router = express.Router();
  const limiter = new ApiRateLimiter();
  router.use(authMiddleware(dependencies.authVerifier), limiter.middleware);

  router.post(
    '/bootstrap',
    route(async (request) => {
      const displayName = request.body?.displayName;
      if (typeof displayName !== 'string') throw new DomainError('DISPLAY_NAME_INVALID', 400);
      return dependencies.persistence.initialize(
        identity(request).userId,
        displayName,
        identity(request).accountKind,
      );
    }),
  );
  router.get(
    '/bootstrap',
    route((request) => dependencies.persistence.bootstrap(identity(request).userId)),
  );
  router.patch(
    '/profile',
    mutationRoute(dependencies, false, (request, payload) => {
      if (typeof payload.displayName !== 'string')
        throw new DomainError('DISPLAY_NAME_INVALID', 400);
      return dependencies.persistence.updateProfile(
        identity(request).userId,
        payload.displayName,
        identity(request).accountKind,
      );
    }),
  );
  router.post(
    '/summon',
    mutationRoute(dependencies, true, (request, payload, key) => {
      if (typeof payload.bannerId !== 'string') throw new DomainError('BANNER_NOT_FOUND', 400);
      return dependencies.persistence.summon(identity(request).userId, payload.bannerId, key);
    }),
  );
  router.post(
    '/heroes/:heroId/star',
    mutationRoute(dependencies, true, (request, _payload, key) =>
      dependencies.persistence.upgradeStar(
        identity(request).userId,
        requiredPathParameter(request.params.heroId),
        key,
      ),
    ),
  );
  router.put(
    '/team',
    mutationRoute(dependencies, true, (request, payload, key) => {
      if (!Array.isArray(payload.heroIds) || !payload.heroIds.every((id) => typeof id === 'string'))
        throw new DomainError('TEAM_INVALID', 400);
      return dependencies.persistence.updateTeam(identity(request).userId, payload.heroIds, key);
    }),
  );
  router.post(
    '/team/slots/unlock',
    mutationRoute(dependencies, true, (request, _payload, key) =>
      dependencies.persistence.unlockTeamSlot(identity(request).userId, key),
    ),
  );
  router.post(
    '/afk/prepare',
    mutationRoute(dependencies, false, (request) =>
      dependencies.persistence.prepareAfkClaim(identity(request).userId),
    ),
  );
  router.post(
    '/afk/:claimId/claim',
    mutationRoute(dependencies, false, (request, _payload, key) =>
      dependencies.persistence.claimAfkReward(
        identity(request).userId,
        requiredPathParameter(request.params.claimId),
        key,
      ),
    ),
  );
  router.get(
    '/summon/history',
    route(async (request) => {
      const requested = Number(request.query.limit ?? 20);
      const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 50) : 20;
      return dependencies.persistence.summonHistory(identity(request).userId, limit);
    }),
  );
  return router;
}

function mutationRoute(
  dependencies: Dependencies,
  restrictDuringCombat: boolean,
  operation: (
    request: AuthenticatedRequest,
    payload: Record<string, unknown>,
    idempotencyKey: string,
  ) => Promise<unknown>,
) {
  return route(async (request) => {
    const validated = validateMutationEnvelope(request.body);
    if (!validated.ok) throw new DomainError(validated.code, 400);
    if (restrictDuringCombat && dependencies.activeUsers.isActive(identity(request).userId))
      throw new DomainError('ACTIVE_COMBAT_RESTRICTION');
    return operation(request, validated.value.payload, validated.value.idempotencyKey);
  });
}

function route(operation: (request: AuthenticatedRequest) => Promise<unknown>) {
  return async (request: AuthenticatedRequest, response: Response) => {
    try {
      const data = await operation(request);
      response.json({ data, requestId: response.locals.requestId });
    } catch (caught) {
      const error = mapPersistenceError(caught);
      response.status(error.status).json({
        error: {
          code: error.code,
          message: safeMessage(error.code),
          requestId: response.locals.requestId,
        },
      });
    }
  };
}

function identity(request: AuthenticatedRequest) {
  if (!request.identity) throw new DomainError('AUTH_REQUIRED', 401);
  return request.identity;
}

function requiredPathParameter(value: string | string[] | undefined) {
  if (typeof value !== 'string') throw new DomainError('SERVER_ERROR', 400);
  return value;
}
