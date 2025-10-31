import { Request, Response } from 'express';
import { BossService } from '@/services/BossService';
import { BossQueryParams, CreateBossRequest, UpdateBossRequest } from '@/types';
import { asyncHandler } from '@/middleware/errorHandler';

export class BossController {
  private bossService: BossService;

  constructor() {
    this.bossService = new BossService();
  }

  getBosses = asyncHandler(async (req: Request, res: Response) => {
    const queryParams: BossQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      server: req.query.server as string,
      difficulty: req.query.difficulty as any,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      search: req.query.search as string,
      sort_by: req.query.sort_by as any || 'created',
      sort_order: req.query.sort_order as any || 'desc'
    };

    const result = await this.bossService.getBosses(queryParams);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getBoss = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.bossService.getBoss(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  createBoss = asyncHandler(async (req: Request, res: Response) => {
    const bossData: CreateBossRequest = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.bossService.createBoss(bossData, userId);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  updateBoss = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateBossRequest = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.bossService.updateBoss(id, updateData, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  deleteBoss = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.bossService.deleteBoss(id, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getBossTimer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.bossService.getBossTimer(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  getBossStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.bossService.getBossStats(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  searchBosses = asyncHandler(async (req: Request, res: Response) => {
    const { q, server } = req.query;
    
    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
      return;
    }

    const result = await this.bossService.searchBosses(q as string, server as string);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getBossesByServer = asyncHandler(async (req: Request, res: Response) => {
    const { server } = req.params;
    const result = await this.bossService.getBossesByServer(server);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getBossesByDifficulty = asyncHandler(async (req: Request, res: Response) => {
    const { difficulty } = req.params;
    const result = await this.bossService.getBossesByDifficulty(difficulty);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });
}
