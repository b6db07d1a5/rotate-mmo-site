import PocketBaseClient from '@/models/PocketBaseClient';
import { Boss, CreateBossRequest, UpdateBossRequest, BossQueryParams, ApiResponse, PaginationInfo } from '@/types';
import { TimerUtils } from '@/utils/timer';
import { ValidationUtils } from '@/utils/validation';

export class BossService {
  private pb: PocketBaseClient;

  constructor() {
    this.pb = PocketBaseClient.getInstance();
  }

  async getBosses(queryParams: BossQueryParams): Promise<ApiResponse<Boss[]>> {
    try {
      const { page = 1, limit = 50, server, difficulty, verified, search, sort_by = 'created', sort_order = 'desc' } = queryParams;

      const paginationValidation = ValidationUtils.validatePaginationParams(page, limit);
      if (!paginationValidation.isValid) {
        return {
          success: false,
          error: paginationValidation.errors.join(', ')
        };
      }

      const sortValidation = ValidationUtils.validateSortParams(sort_by, sort_order, ['name', 'level', 'respawn_time', 'created']);
      if (!sortValidation.isValid) {
        return {
          success: false,
          error: sortValidation.errors.join(', ')
        };
      }

      const filter: any = {};
      if (server) filter.server = server;
      if (difficulty) filter.difficulty = difficulty;
      if (verified !== undefined) filter.verified = verified;
      if (search) {
        filter.name = { $like: `%${search}%` };
      }

      const sort = `${sort_order === 'desc' ? '-' : ''}${sort_by}`;

      const result = await this.pb.getBosses({
        page,
        perPage: limit,
        filter,
        sort
      });

      const pagination: PaginationInfo = {
        page: result.page,
        limit: result.perPage,
        total: result.totalItems,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      };

      return {
        success: true,
        data: result.items,
        pagination
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch bosses'
      };
    }
  }

  async getBoss(id: string): Promise<ApiResponse<Boss>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Boss ID is required'
        };
      }

      const boss = await this.pb.getBoss(id);
      return {
        success: true,
        data: boss
      };
    } catch (error) {
      return {
        success: false,
        error: 'Boss not found'
      };
    }
  }

  async createBoss(data: CreateBossRequest, userId: string): Promise<ApiResponse<Boss>> {
    try {
      const validation = ValidationUtils.validateBossData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const bossData = {
        ...data,
        created_by: userId,
        verified: false,
        name: ValidationUtils.sanitizeString(data.name),
        location: ValidationUtils.sanitizeString(data.location),
        description: data.description ? ValidationUtils.sanitizeString(data.description) : undefined
      };

      const boss = await this.pb.createBoss(bossData);
      return {
        success: true,
        data: boss,
        message: 'Boss created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create boss'
      };
    }
  }

  async updateBoss(id: string, data: UpdateBossRequest, userId: string): Promise<ApiResponse<Boss>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Boss ID is required'
        };
      }

      const existingBoss = await this.pb.getBoss(id);
      if (!existingBoss) {
        return {
          success: false,
          error: 'Boss not found'
        };
      }

      // Check if user has permission to update (creator or admin)
      if (existingBoss.created_by !== userId && existingBoss.role !== 'admin') {
        return {
          success: false,
          error: 'Insufficient permissions to update this boss'
        };
      }

      const updateData: any = {};
      
      if (data.name) updateData.name = ValidationUtils.sanitizeString(data.name);
      if (data.location) updateData.location = ValidationUtils.sanitizeString(data.location);
      if (data.description) updateData.description = ValidationUtils.sanitizeString(data.description);
      if (data.level !== undefined) updateData.level = data.level;
      if (data.respawn_time !== undefined) updateData.respawn_time = data.respawn_time;
      if (data.server) updateData.server = data.server;
      if (data.difficulty) updateData.difficulty = data.difficulty;
      if (data.tags) updateData.tags = data.tags;
      if (data.drops) updateData.drops = data.drops;
      if (data.requirements) updateData.requirements = data.requirements;
      if (data.verified !== undefined) updateData.verified = data.verified;

      const boss = await this.pb.updateBoss(id, updateData);
      return {
        success: true,
        data: boss,
        message: 'Boss updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update boss'
      };
    }
  }

  async deleteBoss(id: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Boss ID is required'
        };
      }

      const existingBoss = await this.pb.getBoss(id);
      if (!existingBoss) {
        return {
          success: false,
          error: 'Boss not found'
        };
      }

      // Check if user has permission to delete (creator or admin)
      if (existingBoss.created_by !== userId && existingBoss.role !== 'admin') {
        return {
          success: false,
          error: 'Insufficient permissions to delete this boss'
        };
      }

      await this.pb.deleteBoss(id);
      return {
        success: true,
        data: true,
        message: 'Boss deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete boss'
      };
    }
  }

  async getBossTimer(id: string): Promise<ApiResponse<any>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Boss ID is required'
        };
      }

      const boss = await this.pb.getBoss(id);
      if (!boss) {
        return {
          success: false,
          error: 'Boss not found'
        };
      }

      // Get recent spawn events for this boss
      const spawnEvents = await this.pb.getSpawnEvents({
        filter: { boss_id: id },
        sort: '-spawn_time',
        perPage: 1
      });

      const lastSpawnEvent = spawnEvents.items[0];
      const timer = TimerUtils.getRespawnTimer(boss, lastSpawnEvent);

      return {
        success: true,
        data: timer
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get boss timer'
      };
    }
  }

  async getBossStats(id: string): Promise<ApiResponse<any>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Boss ID is required'
        };
      }

      const boss = await this.pb.getBoss(id);
      if (!boss) {
        return {
          success: false,
          error: 'Boss not found'
        };
      }

      // Get spawn events for statistics
      const spawnEvents = await this.pb.getSpawnEvents({
        filter: { boss_id: id },
        sort: '-spawn_time'
      });

      const stats = {
        total_spawns: spawnEvents.totalItems,
        accuracy: TimerUtils.calculateSpawnAccuracy(boss, spawnEvents.items),
        last_spawn: boss.last_spawn,
        next_spawn: boss.next_spawn,
        average_respawn_time: boss.respawn_time,
        spawn_predictions: TimerUtils.predictSpawnTimes(boss, spawnEvents.items, 3),
        spawn_windows: TimerUtils.getSpawnWindows(boss, spawnEvents.items)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get boss statistics'
      };
    }
  }

  async searchBosses(query: string, server?: string): Promise<ApiResponse<Boss[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters long'
        };
      }

      const filter: any = {
        name: { $like: `%${query}%` }
      };

      if (server) {
        filter.server = server;
      }

      const result = await this.pb.getBosses({
        filter,
        sort: '-created',
        perPage: 20
      });

      return {
        success: true,
        data: result.items
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search bosses'
      };
    }
  }

  async getBossesByServer(server: string): Promise<ApiResponse<Boss[]>> {
    try {
      if (!server) {
        return {
          success: false,
          error: 'Server name is required'
        };
      }

      const result = await this.pb.getBosses({
        filter: { server },
        sort: 'name',
        perPage: 100
      });

      return {
        success: true,
        data: result.items
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get bosses by server'
      };
    }
  }

  async getBossesByDifficulty(difficulty: string): Promise<ApiResponse<Boss[]>> {
    try {
      if (!ValidationUtils.validateDifficulty(difficulty)) {
        return {
          success: false,
          error: 'Invalid difficulty level'
        };
      }

      const result = await this.pb.getBosses({
        filter: { difficulty },
        sort: 'level',
        perPage: 100
      });

      return {
        success: true,
        data: result.items
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get bosses by difficulty'
      };
    }
  }
}
