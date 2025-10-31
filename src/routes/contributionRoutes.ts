import { Router } from 'express';
import { ContributionController } from '@/controllers/ContributionController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validateRequest, validateQuery, validateParams } from '@/middleware/validation';
import { guildMemberContributionSchemas } from '@/middleware/validation';
import { generalLimiter } from '@/middleware/rateLimiter';
import Joi from 'joi';

const router = Router();
const contributionController = new ContributionController();

// Apply rate limiting to all routes
router.use(generalLimiter);

// GET /api/guild-contributions - Get all guild member contributions with filtering and pagination
router.get(
  '/',
  optionalAuth,
  validateQuery(guildMemberContributionSchemas.query),
  contributionController.getGuildMemberContributions
);

// GET /api/guild-contributions/guild/:guildId - Get contributions for a specific guild
router.get(
  '/guild/:guildId',
  optionalAuth,
  validateParams(Joi.object({ guildId: Joi.string().required() })),
  contributionController.getContributionsByGuild
);

// GET /api/guild-contributions/:id - Get specific contribution
router.get(
  '/:id',
  optionalAuth,
  validateParams(Joi.object({ id: Joi.string().required() })),
  contributionController.getGuildMemberContribution
);

// POST /api/guild-contributions - Create new contribution record (authenticated)
router.post(
  '/',
  authenticateToken,
  validateRequest(guildMemberContributionSchemas.create),
  contributionController.createGuildMemberContribution
);

// PUT /api/guild-contributions/:id - Update contribution (authenticated)
router.put(
  '/:id',
  authenticateToken,
  validateParams(Joi.object({ id: Joi.string().required() })),
  validateRequest(guildMemberContributionSchemas.update),
  contributionController.updateGuildMemberContribution
);

// DELETE /api/guild-contributions/:id - Delete contribution (authenticated)
router.delete(
  '/:id',
  authenticateToken,
  validateParams(Joi.object({ id: Joi.string().required() })),
  contributionController.deleteGuildMemberContribution
);

// POST /api/guild-contributions/guild/:guildId/recalculate - Recalculate contributions for a guild (authenticated)
router.post(
  '/guild/:guildId/recalculate',
  authenticateToken,
  validateParams(Joi.object({ guildId: Joi.string().required() })),
  contributionController.recalculateGuildContributions
);

export default router;

