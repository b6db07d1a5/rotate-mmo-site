import { Router } from 'express';
import { BossController } from '@/controllers/BossController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validateRequest, validateQuery, validateParams } from '@/middleware/validation';
import { bossSchemas } from '@/middleware/validation';
import { generalLimiter, bossCreationLimiter } from '@/middleware/rateLimiter';

const router = Router();
const bossController = new BossController();

// Apply rate limiting to all routes
router.use(generalLimiter);

// GET /api/bosses - Get all bosses with filtering and pagination
router.get(
  '/',
  optionalAuth,
  validateQuery(bossSchemas.query),
  bossController.getBosses
);

// GET /api/bosses/search - Search bosses by name
router.get(
  '/search',
  optionalAuth,
  bossController.searchBosses
);

// GET /api/bosses/server/:server - Get bosses by server
router.get(
  '/server/:server',
  optionalAuth,
  validateParams(bossSchemas.query),
  bossController.getBossesByServer
);

// GET /api/bosses/difficulty/:difficulty - Get bosses by difficulty
router.get(
  '/difficulty/:difficulty',
  optionalAuth,
  validateParams(bossSchemas.query),
  bossController.getBossesByDifficulty
);

// GET /api/bosses/:id - Get specific boss
router.get(
  '/:id',
  optionalAuth,
  validateParams(bossSchemas.query),
  bossController.getBoss
);

// GET /api/bosses/:id/timer - Get boss respawn timer
router.get(
  '/:id/timer',
  optionalAuth,
  validateParams(bossSchemas.query),
  bossController.getBossTimer
);

// GET /api/bosses/:id/stats - Get boss statistics
router.get(
  '/:id/stats',
  optionalAuth,
  validateParams(bossSchemas.query),
  bossController.getBossStats
);

// POST /api/bosses - Create new boss (authenticated)
router.post(
  '/',
  authenticateToken,
  bossCreationLimiter,
  validateRequest(bossSchemas.create),
  bossController.createBoss
);

// PUT /api/bosses/:id - Update boss (authenticated)
router.put(
  '/:id',
  authenticateToken,
  validateParams(bossSchemas.query),
  validateRequest(bossSchemas.update),
  bossController.updateBoss
);

// DELETE /api/bosses/:id - Delete boss (authenticated)
router.delete(
  '/:id',
  authenticateToken,
  validateParams(bossSchemas.query),
  bossController.deleteBoss
);

export default router;
