import { Router } from 'express';
import { SpawnController } from '@/controllers/SpawnController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validateRequest, validateQuery, validateParams } from '@/middleware/validation';
import { spawnEventSchemas } from '@/middleware/validation';
import { generalLimiter, spawnReportLimiter } from '@/middleware/rateLimiter';

const router = Router();
const spawnController = new SpawnController();

// Apply rate limiting to all routes
router.use(generalLimiter);

// GET /api/spawns - Get all spawn events with filtering and pagination
router.get(
  '/',
  optionalAuth,
  validateQuery(spawnEventSchemas.query),
  spawnController.getSpawnEvents
);

// GET /api/spawns/recent - Get recent spawn events
router.get(
  '/recent',
  optionalAuth,
  validateQuery(spawnEventSchemas.query),
  spawnController.getRecentSpawnEvents
);

// GET /api/spawns/statistics - Get spawn statistics
router.get(
  '/statistics',
  optionalAuth,
  validateQuery(spawnEventSchemas.query),
  spawnController.getSpawnStatistics
);

// GET /api/spawns/boss/:bossId - Get spawn events by boss
router.get(
  '/boss/:bossId',
  optionalAuth,
  validateParams(spawnEventSchemas.query),
  validateQuery(spawnEventSchemas.query),
  spawnController.getSpawnEventsByBoss
);

// GET /api/spawns/server/:server - Get spawn events by server
router.get(
  '/server/:server',
  optionalAuth,
  validateParams(spawnEventSchemas.query),
  validateQuery(spawnEventSchemas.query),
  spawnController.getSpawnEventsByServer
);

// GET /api/spawns/:id - Get specific spawn event
router.get(
  '/:id',
  optionalAuth,
  validateParams(spawnEventSchemas.query),
  spawnController.getSpawnEvent
);

// POST /api/spawns - Create new spawn event (authenticated)
router.post(
  '/',
  authenticateToken,
  spawnReportLimiter,
  validateRequest(spawnEventSchemas.create),
  spawnController.createSpawnEvent
);

// PUT /api/spawns/:id - Update spawn event (authenticated)
router.put(
  '/:id',
  authenticateToken,
  validateParams(spawnEventSchemas.query),
  validateRequest(spawnEventSchemas.update),
  spawnController.updateSpawnEvent
);

// DELETE /api/spawns/:id - Delete spawn event (authenticated)
router.delete(
  '/:id',
  authenticateToken,
  validateParams(spawnEventSchemas.query),
  spawnController.deleteSpawnEvent
);

// POST /api/spawns/:id/verify - Verify spawn event (authenticated)
router.post(
  '/:id/verify',
  authenticateToken,
  validateParams(spawnEventSchemas.query),
  spawnController.verifySpawnEvent
);

export default router;
