import rateLimit from 'express-rate-limit';
import config from '@/config';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bossCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 boss creations per hour
  message: {
    success: false,
    error: 'Too many boss creations, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const spawnReportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 spawn reports per 5 minutes
  message: {
    success: false,
    error: 'Too many spawn reports, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 comments per minute
  message: {
    success: false,
    error: 'Too many comments, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
