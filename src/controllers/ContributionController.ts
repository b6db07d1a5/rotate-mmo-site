import { Request, Response } from 'express';
import { ContributionService } from '@/services/ContributionService';
import {
  GuildMemberContributionQueryParams,
  CreateGuildMemberContributionRequest,
  UpdateGuildMemberContributionRequest
} from '@/types';
import { asyncHandler } from '@/middleware/errorHandler';

export class ContributionController {
  private contributionService: ContributionService;

  constructor() {
    this.contributionService = new ContributionService();
  }

  getGuildMemberContributions = asyncHandler(async (req: Request, res: Response) => {
    const queryParams: GuildMemberContributionQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      guild_id: req.query.guild_id as string,
      member_name: req.query.member_name as string,
      sort_by: req.query.sort_by as any || 'contribution_score',
      sort_order: req.query.sort_order as any || 'desc'
    };

    const result = await this.contributionService.getGuildMemberContributions(queryParams);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getGuildMemberContribution = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.contributionService.getGuildMemberContribution(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  createGuildMemberContribution = asyncHandler(async (req: Request, res: Response) => {
    const contributionData: CreateGuildMemberContributionRequest = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.contributionService.createGuildMemberContribution(
      contributionData,
      userId
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  updateGuildMemberContribution = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateGuildMemberContributionRequest = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.contributionService.updateGuildMemberContribution(
      id,
      updateData,
      userId
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  deleteGuildMemberContribution = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.contributionService.deleteGuildMemberContribution(id, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getContributionsByGuild = asyncHandler(async (req: Request, res: Response) => {
    const { guildId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await this.contributionService.getContributionsByGuild(guildId, page, limit);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  recalculateGuildContributions = asyncHandler(async (req: Request, res: Response) => {
    const { guildId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.contributionService.recalculateGuildContributions(guildId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });
}

