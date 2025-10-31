import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@/config';
import PocketBaseClient from '@/models/PocketBaseClient';
import { ApiResponse } from '@/types';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      } as ApiResponse);
      return;
    }

    const pb = PocketBaseClient.getInstance();
    
    if (!pb.isAuthenticated()) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      } as ApiResponse);
      return;
    }

    const user = pb.getCurrentUser();
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    } as ApiResponse);
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const pb = PocketBaseClient.getInstance();
      if (pb.isAuthenticated()) {
        req.user = pb.getCurrentUser();
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    } as ApiResponse);
  }
};

export const requireGuildMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse);
      return;
    }

    const guildId = req.params.guildId || req.body.guild_id;
    
    if (!guildId) {
      res.status(400).json({
        success: false,
        error: 'Guild ID required'
      } as ApiResponse);
      return;
    }

    const pb = PocketBaseClient.getInstance();
    const guild = await pb.getGuild(guildId);

    if (!guild || !guild.members.includes(req.user.id)) {
      res.status(403).json({
        success: false,
        error: 'Guild membership required'
      } as ApiResponse);
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Guild authorization check failed'
    } as ApiResponse);
  }
};
