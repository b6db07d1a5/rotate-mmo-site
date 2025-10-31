import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validateRequest, validateQuery, validateParams } from '@/middleware/validation';
import { userSchemas } from '@/middleware/validation';
import { generalLimiter, authLimiter } from '@/middleware/rateLimiter';

const router = Router();
const userController = new UserController();

// Apply rate limiting to all routes
router.use(generalLimiter);

// GET /api/users - Get all users with filtering and pagination
router.get(
  '/',
  optionalAuth,
  validateQuery(userSchemas.query),
  userController.getUsers
);

// GET /api/users/search - Search users
router.get(
  '/search',
  optionalAuth,
  userController.searchUsers
);

// GET /api/users/me - Get current user
router.get(
  '/me',
  authenticateToken,
  userController.getCurrentUser
);

// GET /api/users/:id - Get specific user
router.get(
  '/:id',
  optionalAuth,
  validateParams(userSchemas.query),
  userController.getUser
);

// GET /api/users/:id/stats - Get user statistics
router.get(
  '/:id/stats',
  optionalAuth,
  validateParams(userSchemas.query),
  userController.getUserStats
);

// POST /api/users - Create new user (register)
router.post(
  '/',
  authLimiter,
  validateRequest(userSchemas.create),
  userController.createUser
);

// POST /api/users/login - User login
router.post(
  '/login',
  authLimiter,
  validateRequest(userSchemas.login),
  userController.login
);

// POST /api/users/logout - User logout
router.post(
  '/logout',
  authenticateToken,
  userController.logout
);

// PUT /api/users/:id - Update user (authenticated)
router.put(
  '/:id',
  authenticateToken,
  validateParams(userSchemas.query),
  validateRequest(userSchemas.update),
  userController.updateUser
);

// DELETE /api/users/:id - Delete user (authenticated)
router.delete(
  '/:id',
  authenticateToken,
  validateParams(userSchemas.query),
  userController.deleteUser
);

// POST /api/users/:userId/favorites/:bossId - Add boss to favorites
router.post(
  '/:userId/favorites/:bossId',
  authenticateToken,
  validateParams(userSchemas.query),
  userController.addFavoriteBoss
);

// DELETE /api/users/:userId/favorites/:bossId - Remove boss from favorites
router.delete(
  '/:userId/favorites/:bossId',
  authenticateToken,
  validateParams(userSchemas.query),
  userController.removeFavoriteBoss
);

export default router;
