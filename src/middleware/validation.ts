import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '@/types';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
      return;
    }
    
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
      return;
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      } as ApiResponse);
      return;
    }
    
    next();
  };
};

// Validation schemas
export const bossSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    level: Joi.number().integer().min(1).max(1000).required(),
    location: Joi.string().min(1).max(200).required(),
    respawn_time: Joi.number().integer().min(1).max(10080).required(), // max 1 week
    server: Joi.string().min(1).max(50).required(),
    description: Joi.string().max(1000).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard', 'extreme', 'legendary').required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    drops: Joi.array().items(Joi.string().max(100)).max(20).optional(),
    requirements: Joi.array().items(Joi.string().max(200)).max(10).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    level: Joi.number().integer().min(1).max(1000).optional(),
    location: Joi.string().min(1).max(200).optional(),
    respawn_time: Joi.number().integer().min(1).max(10080).optional(),
    server: Joi.string().min(1).max(50).optional(),
    description: Joi.string().max(1000).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard', 'extreme', 'legendary').optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    drops: Joi.array().items(Joi.string().max(100)).max(20).optional(),
    requirements: Joi.array().items(Joi.string().max(200)).max(10).optional(),
    verified: Joi.boolean().optional()
  }),
  
  query: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    server: Joi.string().max(50).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard', 'extreme', 'legendary').optional(),
    verified: Joi.boolean().optional(),
    search: Joi.string().max(100).optional(),
    sort_by: Joi.string().valid('name', 'level', 'respawn_time', 'created').default('created'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export const spawnEventSchemas = {
  create: Joi.object({
    boss_id: Joi.string().required(),
    spawn_time: Joi.date().iso().required(),
    server: Joi.string().min(1).max(50).required(),
    notes: Joi.string().max(500).optional(),
    coordinates: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      z: Joi.number().optional()
    }).optional()
  }),
  
  update: Joi.object({
    spawn_time: Joi.date().iso().optional(),
    server: Joi.string().min(1).max(50).optional(),
    notes: Joi.string().max(500).optional(),
    coordinates: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      z: Joi.number().optional()
    }).optional(),
    verified: Joi.boolean().optional(),
    kill_time: Joi.date().iso().optional(),
    participants: Joi.array().items(Joi.string()).optional()
  }),
  
  query: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    boss_id: Joi.string().optional(),
    server: Joi.string().max(50).optional(),
    verified: Joi.boolean().optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional()
  })
};

export const userSchemas = {
  create: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    guild: Joi.string().optional()
  }),
  
  update: Joi.object({
    username: Joi.string().min(3).max(50).optional(),
    email: Joi.string().email().optional(),
    favorite_bosses: Joi.array().items(Joi.string()).max(50).optional(),
    notification_settings: Joi.object({
      push_notifications: Joi.boolean().optional(),
      notification_timing: Joi.array().items(Joi.object({
        type: Joi.string().valid('minutes', 'seconds').required(),
        value: Joi.number().integer().min(1).max(300).required()
      })).max(5).optional(),
      guild_notifications: Joi.boolean().optional(),
      rare_boss_alerts: Joi.boolean().optional()
    }).optional(),
    guild: Joi.string().optional(),
    avatar: Joi.string().optional(),
    bio: Joi.string().max(500).optional()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  query: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    guild: Joi.string().optional(),
    search: Joi.string().max(100).optional(),
    sort_by: Joi.string().valid('username', 'created', 'stats.reports_count').default('created'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export const commentSchemas = {
  create: Joi.object({
    boss_id: Joi.string().required(),
    content: Joi.string().min(1).max(1000).required(),
    parent_id: Joi.string().optional()
  }),
  
  update: Joi.object({
    content: Joi.string().min(1).max(1000).required()
  })
};

export const guildSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    notification_channel: Joi.string().max(100).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(500).optional(),
    notification_channel: Joi.string().max(100).optional()
  })
};

export const guildMemberContributionSchemas = {
  create: Joi.object({
    guild_id: Joi.string().required(),
    member_name: Joi.string().min(1).max(100).required(),
    member_id: Joi.string().optional()
  }),
  
  update: Joi.object({
    member_name: Joi.string().min(1).max(100).optional(),
    contribution_score: Joi.number().integer().min(0).optional()
  }),
  
  query: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    guild_id: Joi.string().optional(),
    member_name: Joi.string().max(100).optional(),
    sort_by: Joi.string().valid('member_name', 'contribution_score', 'created').default('contribution_score'),
    sort_order: Joi.string().valid('asc', 'desc').default('desc')
  })
};
