import { Request, Response } from 'express';
import { UserService } from '@/services/UserService';
import { UserQueryParams, CreateUserRequest, UpdateUserRequest, LoginRequest } from '@/types';
import { asyncHandler } from '@/middleware/errorHandler';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const queryParams: UserQueryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      guild: req.query.guild as string,
      search: req.query.search as string,
      sort_by: req.query.sort_by as any || 'created',
      sort_order: req.query.sort_order as any || 'desc'
    };

    const result = await this.userService.getUsers(queryParams);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.userService.getUser(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserRequest = req.body;
    const result = await this.userService.createUser(userData);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateUserRequest = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.updateUser(id, updateData, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const result = await this.userService.deleteUser(id, userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const credentials: LoginRequest = req.body;
    const result = await this.userService.login(credentials);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.logout();
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }
    
    const result = await this.userService.getCurrentUser(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  });

  addFavoriteBoss = asyncHandler(async (req: Request, res: Response) => {
    const { userId, bossId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Users can only modify their own favorites
    if (userId !== currentUserId) {
      res.status(403).json({
        success: false,
        error: 'Can only modify your own favorites'
      });
      return;
    }

    const result = await this.userService.addFavoriteBoss(userId, bossId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  removeFavoriteBoss = asyncHandler(async (req: Request, res: Response) => {
    const { userId, bossId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    if (!currentUserId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Users can only modify their own favorites
    if (userId !== currentUserId) {
      res.status(403).json({
        success: false,
        error: 'Can only modify your own favorites'
      });
      return;
    }

    const result = await this.userService.removeFavoriteBoss(userId, bossId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.userService.getUserStats(id);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
      return;
    }

    const result = await this.userService.searchUsers(q as string);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });
}
