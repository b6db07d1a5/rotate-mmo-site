import SupabaseClientWrapper from '@/models/SupabaseClient';
import { SpawnEvent, CreateSpawnEventRequest, UpdateSpawnEventRequest, SpawnEventQueryParams, ApiResponse, PaginationInfo } from '@/types';
import { TimerUtils } from '@/utils/timer';
import { ValidationUtils } from '@/utils/validation';
import { ContributionService } from './ContributionService';

export class SpawnService {
  private pb: SupabaseClientWrapper;
  private contributionService: ContributionService;

  constructor() {
    this.pb = SupabaseClientWrapper.getInstance();
    this.contributionService = new ContributionService();
  }

  async getSpawnEvents(queryParams: SpawnEventQueryParams): Promise<ApiResponse<SpawnEvent[]>> {
    try {
      const { page = 1, limit = 50, boss_id, server, verified, date_from, date_to } = queryParams;

      const paginationValidation = ValidationUtils.validatePaginationParams(page, limit);
      if (!paginationValidation.isValid) {
        return {
          success: false,
          error: paginationValidation.errors.join(', ')
        };
      }

      const filter: any = {};
      if (boss_id) filter.boss_id = boss_id;
      if (server) filter.server = server;
      if (verified !== undefined) filter.verified = verified;
      
      if (date_from || date_to) {
        filter.spawn_time = {};
        if (date_from) filter.spawn_time['>='] = date_from;
        if (date_to) filter.spawn_time['<='] = date_to;
      }

      const result = await this.pb.getSpawnEvents({
        page,
        perPage: limit,
        filter,
        sort: '-spawn_time'
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
        error: 'Failed to fetch spawn events'
      };
    }
  }

  async getSpawnEvent(id: string): Promise<ApiResponse<SpawnEvent>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Spawn event ID is required'
        };
      }

      const spawnEvent = await this.pb.getSpawnEvent(id);
      return {
        success: true,
        data: spawnEvent
      };
    } catch (error) {
      return {
        success: false,
        error: 'Spawn event not found'
      };
    }
  }

  async createSpawnEvent(data: CreateSpawnEventRequest, userId: string): Promise<ApiResponse<SpawnEvent>> {
    try {
      const validation = ValidationUtils.validateSpawnEventData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Verify boss exists
      const boss = await this.pb.getBoss(data.boss_id);
      if (!boss) {
        return {
          success: false,
          error: 'Boss not found'
        };
      }

      // Check for duplicate spawn events (same boss within 5 minutes)
      const recentEvents = await this.pb.getSpawnEvents({
        filter: {
          boss_id: data.boss_id,
          spawn_time: {
            '>=': new Date(new Date(data.spawn_time).getTime() - 5 * 60000).toISOString(),
            '<=': new Date(new Date(data.spawn_time).getTime() + 5 * 60000).toISOString()
          }
        },
        perPage: 1
      });

      if (recentEvents.items.length > 0) {
        return {
          success: false,
          error: 'A spawn event for this boss already exists within 5 minutes of this time'
        };
      }

      const spawnEventData = {
        ...data,
        reported_by: userId,
        verified: false,
        notes: data.notes ? ValidationUtils.sanitizeString(data.notes) : undefined
      };

      const spawnEvent = await this.pb.createSpawnEvent(spawnEventData);

      // Update boss with new spawn information
      await this.pb.updateBoss(data.boss_id, {
        last_spawn: data.spawn_time,
        next_spawn: TimerUtils.calculateNextSpawn(boss, spawnEvent)
      });

      return {
        success: true,
        data: spawnEvent,
        message: 'Spawn event created successfully'
      };
    } catch (error: any) {
      // Return detailed error message for debugging
      const errorMessage = error?.message || error?.error?.message || 'Failed to create spawn event';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async updateSpawnEvent(id: string, data: UpdateSpawnEventRequest, userId: string): Promise<ApiResponse<SpawnEvent>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Spawn event ID is required'
        };
      }

      const existingEvent = await this.pb.getSpawnEvent(id);
      if (!existingEvent) {
        return {
          success: false,
          error: 'Spawn event not found'
        };
      }

      // Check if user has permission to update (reporter or admin)
      if (existingEvent.reported_by !== userId) {
        // Check if user is admin
        try {
          const user = await this.pb.getUser(userId);
          if (!user || (user as any).role !== 'admin') {
            return {
              success: false,
              error: 'Insufficient permissions to update this spawn event'
            };
          }
        } catch (error) {
          return {
            success: false,
            error: 'Insufficient permissions to update this spawn event'
          };
        }
      }

      const updateData: any = {};
      
      if (data.spawn_time) updateData.spawn_time = data.spawn_time;
      if (data.server) updateData.server = data.server;
      if (data.notes) updateData.notes = ValidationUtils.sanitizeString(data.notes);
      if (data.coordinates) updateData.coordinates = data.coordinates;
      if (data.verified !== undefined) updateData.verified = data.verified;
      if (data.kill_time) updateData.kill_time = data.kill_time;
      if (data.participants !== undefined) updateData.participants = data.participants;

      const spawnEvent = await this.pb.updateSpawnEvent(id, updateData);

      // If spawn time was updated, recalculate boss next spawn
      if (data.spawn_time) {
        const boss = await this.pb.getBoss(existingEvent.boss_id);
        if (boss) {
          await this.pb.updateBoss(existingEvent.boss_id, {
            last_spawn: data.spawn_time,
            next_spawn: TimerUtils.calculateNextSpawn(boss, spawnEvent)
          });
        }
      }

      // Track contributions when participants are added or updated
      if (data.participants !== undefined && Array.isArray(data.participants)) {
        await this.updateContributionsForParticipants(
          data.participants,
          spawnEvent.spawn_time || existingEvent.spawn_time,
          spawnEvent.server || existingEvent.server
        );
      }

      return {
        success: true,
        data: spawnEvent,
        message: 'Spawn event updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update spawn event'
      };
    }
  }

  async deleteSpawnEvent(id: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Spawn event ID is required'
        };
      }

      const existingEvent = await this.pb.getSpawnEvent(id);
      if (!existingEvent) {
        return {
          success: false,
          error: 'Spawn event not found'
        };
      }

      // Check if user has permission to delete (reporter or admin)
      if (existingEvent.reported_by !== userId) {
        // Check if user is admin
        try {
          const user = await this.pb.getUser(userId);
          if (!user || (user as any).role !== 'admin') {
            return {
              success: false,
              error: 'Insufficient permissions to delete this spawn event'
            };
          }
        } catch (error) {
          return {
            success: false,
            error: 'Insufficient permissions to delete this spawn event'
          };
        }
      }

      await this.pb.deleteSpawnEvent(id);
      return {
        success: true,
        data: true,
        message: 'Spawn event deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete spawn event'
      };
    }
  }

  async verifySpawnEvent(id: string, userId: string): Promise<ApiResponse<SpawnEvent>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Spawn event ID is required'
        };
      }

      const spawnEvent = await this.pb.getSpawnEvent(id);
      if (!spawnEvent) {
        return {
          success: false,
          error: 'Spawn event not found'
        };
      }

      // Only allow verification by admin or the original reporter
      if (spawnEvent.reported_by !== userId) {
        // Check if user is admin
        try {
          const user = await this.pb.getUser(userId);
          if (!user || (user as any).role !== 'admin') {
            return {
              success: false,
              error: 'Insufficient permissions to verify this spawn event'
            };
          }
        } catch (error) {
          return {
            success: false,
            error: 'Insufficient permissions to verify this spawn event'
          };
        }
      }

      const updatedEvent = await this.pb.updateSpawnEvent(id, { verified: true });
      return {
        success: true,
        data: updatedEvent,
        message: 'Spawn event verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to verify spawn event'
      };
    }
  }

  async getSpawnEventsByBoss(bossId: string, limit: number = 20): Promise<ApiResponse<SpawnEvent[]>> {
    try {
      if (!bossId) {
        return {
          success: false,
          error: 'Boss ID is required'
        };
      }

      const result = await this.pb.getSpawnEvents({
        filter: { boss_id: bossId },
        sort: '-spawn_time',
        perPage: limit
      });

      return {
        success: true,
        data: result.items
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get spawn events by boss'
      };
    }
  }

  async getSpawnEventsByServer(server: string, limit: number = 50): Promise<ApiResponse<SpawnEvent[]>> {
    try {
      if (!server) {
        return {
          success: false,
          error: 'Server name is required'
        };
      }

      const result = await this.pb.getSpawnEvents({
        filter: { server },
        sort: '-spawn_time',
        perPage: limit
      });

      return {
        success: true,
        data: result.items
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get spawn events by server'
      };
    }
  }

  async getRecentSpawnEvents(limit: number = 20): Promise<ApiResponse<SpawnEvent[]>> {
    try {
      const result = await this.pb.getSpawnEvents({
        sort: '-spawn_time',
        perPage: limit
      });

      return {
        success: true,
        data: result.items
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get recent spawn events'
      };
    }
  }

  async getSpawnStatistics(bossId?: string, server?: string, dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> {
    try {
      const filter: any = {};
      if (bossId) filter.boss_id = bossId;
      if (server) filter.server = server;
      if (dateFrom || dateTo) {
        filter.spawn_time = {};
        if (dateFrom) filter.spawn_time['>='] = dateFrom;
        if (dateTo) filter.spawn_time['<='] = dateTo;
      }

      const result = await this.pb.getSpawnEvents({
        filter,
        sort: '-spawn_time'
      });

      const stats = {
        total_spawns: result.totalItems,
        verified_spawns: result.items.filter(event => event.verified).length,
        verification_rate: result.totalItems > 0 ? (result.items.filter(event => event.verified).length / result.totalItems) * 100 : 0,
        recent_spawns: result.items.slice(0, 10),
        spawns_by_server: this.groupByServer(result.items),
        spawns_by_boss: this.groupByBoss(result.items)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get spawn statistics'
      };
    }
  }

  private groupByServer(spawnEvents: SpawnEvent[]): Record<string, number> {
    return spawnEvents.reduce((acc, event) => {
      acc[event.server] = (acc[event.server] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByBoss(spawnEvents: SpawnEvent[]): Record<string, number> {
    return spawnEvents.reduce((acc, event) => {
      acc[event.boss_id] = (acc[event.boss_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Update contribution scores for participants when they join a spawn event
   */
  private async updateContributionsForParticipants(
    participants: string[],
    spawnTime: string,
    server: string
  ): Promise<void> {
    try {
      if (!participants || participants.length === 0) return;

      // Get all users who participated to find their guilds
      const guildParticipantMap: Record<string, { memberNames: string[]; memberIds: string[] }> = {}; // guild_id -> {memberNames, memberIds}

      for (const participant of participants) {
        // Try to find user by name or ID
        try {
          // Try to find by username first
          let users = await this.pb.getUsers({
            filter: { username: participant },
            perPage: 1
          });

          // If not found by username, try by ID
          if (users.items.length === 0) {
            try {
              users = await this.pb.getUsers({
                filter: { id: participant },
                perPage: 1
              });
            } catch (idError) {
              // ID might not be valid for filter, skip
            }
          }

          if (users.items.length > 0) {
            const user = users.items[0];
            if (user.guild) {
              if (!guildParticipantMap[user.guild]) {
                guildParticipantMap[user.guild] = { memberNames: [], memberIds: [] };
              }
              guildParticipantMap[user.guild].memberNames.push(user.username || participant);
              if (user.id) {
                guildParticipantMap[user.guild].memberIds.push(user.id);
              }
            }
          } else {
            // If user not found, try to find existing contribution records with this member name
            // This allows tracking members even if they're not in the user system
            try {
              const contributions = await this.pb.getGuildMemberContributions({
                filter: { member_name: participant },
                perPage: 10
              });

              // Update contributions for all guilds where this member name exists
              for (const contribution of contributions.items) {
                if (!guildParticipantMap[contribution.guild_id]) {
                  guildParticipantMap[contribution.guild_id] = { memberNames: [], memberIds: [] };
                }
                guildParticipantMap[contribution.guild_id].memberNames.push(participant);
              }
            } catch (contributionError) {
              // If no contribution record exists, we can't track this participant
              // They would need to be added to a guild's contribution records first
              console.warn(`No contribution record found for participant: ${participant}`);
            }
          }
        } catch (error) {
          // Continue with next participant if user lookup fails
          console.error(`Failed to lookup user for participant ${participant}:`, error);
        }
      }

      // Update contributions for each guild
      for (const [guildId, data] of Object.entries(guildParticipantMap)) {
        for (let i = 0; i < data.memberNames.length; i++) {
          const memberName = data.memberNames[i];
          const memberId = data.memberIds[i];
          await this.contributionService.incrementContribution(
            guildId,
            memberName,
            memberId,
            spawnTime
          );
        }
      }
    } catch (error) {
      // Log error but don't fail the spawn event update
      console.error('Failed to update contributions for participants:', error);
    }
  }
}
