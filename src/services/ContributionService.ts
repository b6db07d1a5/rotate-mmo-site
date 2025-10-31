import SupabaseClientWrapper from '@/models/SupabaseClient';
import {
  GuildMemberContribution,
  CreateGuildMemberContributionRequest,
  UpdateGuildMemberContributionRequest,
  GuildMemberContributionQueryParams,
  ApiResponse,
  PaginationInfo
} from '@/types';
import { ValidationUtils } from '@/utils/validation';

export class ContributionService {
  private pb: SupabaseClientWrapper;

  constructor() {
    this.pb = SupabaseClientWrapper.getInstance();
  }

  async getGuildMemberContributions(
    queryParams: GuildMemberContributionQueryParams
  ): Promise<ApiResponse<GuildMemberContribution[]>> {
    try {
      const {
        page = 1,
        limit = 50,
        guild_id,
        member_name,
        sort_by = 'contribution_score',
        sort_order = 'desc'
      } = queryParams;

      const paginationValidation = ValidationUtils.validatePaginationParams(page, limit);
      if (!paginationValidation.isValid) {
        return {
          success: false,
          error: paginationValidation.errors.join(', ')
        };
      }

      const sortValidation = ValidationUtils.validateSortParams(
        sort_by,
        sort_order,
        ['member_name', 'contribution_score', 'created']
      );
      if (!sortValidation.isValid) {
        return {
          success: false,
          error: sortValidation.errors.join(', ')
        };
      }

      const filter: any = {};
      if (guild_id) filter.guild_id = guild_id;
      if (member_name) {
        filter.member_name = { $like: `%${member_name}%` };
      }

      const sort = `${sort_order === 'desc' ? '-' : ''}${sort_by}`;

      const result = await this.pb.getGuildMemberContributions({
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
        error: 'Failed to fetch guild member contributions'
      };
    }
  }

  async getGuildMemberContribution(id: string): Promise<ApiResponse<GuildMemberContribution>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Contribution ID is required'
        };
      }

      const contribution = await this.pb.getGuildMemberContribution(id);
      return {
        success: true,
        data: contribution
      };
    } catch (error) {
      return {
        success: false,
        error: 'Guild member contribution not found'
      };
    }
  }

  async createGuildMemberContribution(
    data: CreateGuildMemberContributionRequest,
    userId: string
  ): Promise<ApiResponse<GuildMemberContribution>> {
    try {
      if (!data.guild_id) {
        return {
          success: false,
          error: 'Guild ID is required'
        };
      }

      if (!data.member_name || data.member_name.trim().length === 0) {
        return {
          success: false,
          error: 'Member name is required'
        };
      }

      // Verify guild exists
      const guild = await this.pb.getGuild(data.guild_id);
      if (!guild) {
        return {
          success: false,
          error: 'Guild not found'
        };
      }

      // Check if contribution already exists for this member in this guild
      const existingContributions = await this.pb.getGuildMemberContributions({
        filter: {
          guild_id: data.guild_id,
          member_name: data.member_name
        },
        perPage: 1
      });

      if (existingContributions.items.length > 0) {
        return {
          success: false,
          error: 'Contribution record already exists for this member in this guild'
        };
      }

      const contributionData = {
        guild_id: data.guild_id,
        member_name: ValidationUtils.sanitizeString(data.member_name),
        member_id: data.member_id || undefined,
        contribution_score: 0,
        last_event_date: undefined
      };

      const contribution = await this.pb.createGuildMemberContribution(contributionData);
      return {
        success: true,
        data: contribution,
        message: 'Guild member contribution created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create guild member contribution'
      };
    }
  }

  async updateGuildMemberContribution(
    id: string,
    data: UpdateGuildMemberContributionRequest,
    userId: string
  ): Promise<ApiResponse<GuildMemberContribution>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Contribution ID is required'
        };
      }

      const existingContribution = await this.pb.getGuildMemberContribution(id);
      if (!existingContribution) {
        return {
          success: false,
          error: 'Guild member contribution not found'
        };
      }

      // Verify guild exists if we need to check permissions
      const guild = await this.pb.getGuild(existingContribution.guild_id);
      if (!guild) {
        return {
          success: false,
          error: 'Guild not found'
        };
      }

      const updateData: any = {};
      if (data.member_name) {
        updateData.member_name = ValidationUtils.sanitizeString(data.member_name);
      }
      if (data.contribution_score !== undefined) {
        updateData.contribution_score = data.contribution_score;
      }

      const contribution = await this.pb.updateGuildMemberContribution(id, updateData);
      return {
        success: true,
        data: contribution,
        message: 'Guild member contribution updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update guild member contribution'
      };
    }
  }

  async deleteGuildMemberContribution(
    id: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Contribution ID is required'
        };
      }

      const existingContribution = await this.pb.getGuildMemberContribution(id);
      if (!existingContribution) {
        return {
          success: false,
          error: 'Guild member contribution not found'
        };
      }

      await this.pb.deleteGuildMemberContribution(id);
      return {
        success: true,
        data: true,
        message: 'Guild member contribution deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete guild member contribution'
      };
    }
  }

  /**
   * Increment contribution score for a member when they join an event
   */
  async incrementContribution(
    guildId: string,
    memberName: string,
    memberId?: string,
    eventDate?: string
  ): Promise<ApiResponse<GuildMemberContribution>> {
    try {
      if (!guildId || !memberName) {
        return {
          success: false,
          error: 'Guild ID and member name are required'
        };
      }

      // Find existing contribution or create new one
      const existingContributions = await this.pb.getGuildMemberContributions({
        filter: {
          guild_id: guildId,
          member_name: memberName
        },
        perPage: 1
      });

      let contribution: GuildMemberContribution;

      if (existingContributions.items.length > 0) {
        // Update existing contribution
        const existing = existingContributions.items[0];
        const updatedData: any = {
          contribution_score: (existing.contribution_score || 0) + 1
        };
        
        if (eventDate) {
          updatedData.last_event_date = eventDate;
        }

        contribution = await this.pb.updateGuildMemberContribution(existing.id, updatedData);
      } else {
        // Create new contribution
        const contributionData = {
          guild_id: guildId,
          member_name: ValidationUtils.sanitizeString(memberName),
          member_id: memberId || undefined,
          contribution_score: 1,
          last_event_date: eventDate || new Date().toISOString()
        };

        contribution = await this.pb.createGuildMemberContribution(contributionData);
      }

      return {
        success: true,
        data: contribution,
        message: 'Contribution updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to increment contribution'
      };
    }
  }

  /**
   * Recalculate contribution scores for all members in a guild based on spawn events
   */
  async recalculateGuildContributions(guildId: string): Promise<ApiResponse<boolean>> {
    try {
      if (!guildId) {
        return {
          success: false,
          error: 'Guild ID is required'
        };
      }

      // Get all spawn events with participants
      const spawnEvents = await this.pb.getSpawnEvents({
        filter: {
          'participants?length': { '>': 0 }
        },
        sort: '-spawn_time'
      });

      // Get guild members
      const guild = await this.pb.getGuild(guildId);
      if (!guild) {
        return {
          success: false,
          error: 'Guild not found'
        };
      }

      // Count contributions per member
      const contributionCounts: Record<string, { count: number; lastEventDate?: string }> = {};

      for (const event of spawnEvents.items) {
        if (!event.participants || event.participants.length === 0) continue;

        for (const participant of event.participants) {
          if (!contributionCounts[participant]) {
            contributionCounts[participant] = { count: 0 };
          }
          contributionCounts[participant].count++;
          
          // Update last event date if this event is more recent
          if (event.spawn_time) {
            const eventDate = new Date(event.spawn_time);
            const lastDate = contributionCounts[participant].lastEventDate
              ? new Date(contributionCounts[participant].lastEventDate!)
              : null;

            if (!lastDate || eventDate > lastDate) {
              contributionCounts[participant].lastEventDate = event.spawn_time;
            }
          }
        }
      }

      // Update or create contribution records
      for (const [memberName, data] of Object.entries(contributionCounts)) {
        const existingContributions = await this.pb.getGuildMemberContributions({
          filter: {
            guild_id: guildId,
            member_name: memberName
          },
          perPage: 1
        });

        if (existingContributions.items.length > 0) {
          const existing = existingContributions.items[0];
          await this.pb.updateGuildMemberContribution(existing.id, {
            contribution_score: data.count,
            last_event_date: data.lastEventDate
          });
        } else {
          await this.pb.createGuildMemberContribution({
            guild_id: guildId,
            member_name: memberName,
            contribution_score: data.count,
            last_event_date: data.lastEventDate
          });
        }
      }

      return {
        success: true,
        data: true,
        message: 'Guild contributions recalculated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to recalculate guild contributions'
      };
    }
  }

  /**
   * Get contributions for a specific guild
   */
  async getContributionsByGuild(
    guildId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<GuildMemberContribution[]>> {
    return this.getGuildMemberContributions({
      guild_id: guildId,
      page,
      limit,
      sort_by: 'contribution_score',
      sort_order: 'desc'
    });
  }
}

