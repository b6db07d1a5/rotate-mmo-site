import { Request, Response } from 'express';
import { SpawnService } from '@/services/SpawnService';
import { SpawnEventQueryParams, CreateSpawnEventRequest, UpdateSpawnEventRequest } from '@/types';
import { asyncHandler } from '@/middleware/errorHandler';

export class SpawnController {
  private spawnService: SpawnService;

  constructor() {
    this.spawnService = new SpawnService();
  }

  getSpawnEvents = asyncHandler(async (req: Request, res: Response) => {
    const queryParams: SpawnEventQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      boss_id: req.query.boss_id as string,
      server: req.query.server as string,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };

    const result = await this.spawnService.getSpawnEvents(queryParams);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getSpawnEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.spawnService.getSpawnEvent(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  createSpawnEvent = asyncHandler(async (req: Request, res: Response) => {
    const spawnData: CreateSpawnEventRequest = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.spawnService.createSpawnEvent(spawnData, userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  updateSpawnEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateSpawnEventRequest = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.spawnService.updateSpawnEvent(id, updateData, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  deleteSpawnEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.spawnService.deleteSpawnEvent(id, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  verifySpawnEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.spawnService.verifySpawnEvent(id, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getSpawnEventsByBoss = asyncHandler(async (req: Request, res: Response) => {
    const { bossId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await this.spawnService.getSpawnEventsByBoss(bossId, limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getSpawnEventsByServer = asyncHandler(async (req: Request, res: Response) => {
    const { server } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await this.spawnService.getSpawnEventsByServer(server, limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getRecentSpawnEvents = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await this.spawnService.getRecentSpawnEvents(limit);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getSpawnStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { boss_id, server, date_from, date_to } = req.query;
    
    const result = await this.spawnService.getSpawnStatistics(
      boss_id as string,
      server as string,
      date_from as string,
      date_to as string
    );
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });
}
