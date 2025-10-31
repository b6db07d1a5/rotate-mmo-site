import { Router } from 'express';
import bossRoutes from './bossRoutes';
import spawnRoutes from './spawnRoutes';
import userRoutes from './userRoutes';
import contributionRoutes from './contributionRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Boss Respawn Tracker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/bosses', bossRoutes);
router.use('/spawns', spawnRoutes);
router.use('/users', userRoutes);
router.use('/guild-contributions', contributionRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint ${req.originalUrl} not found`
  });
});

export default router;
