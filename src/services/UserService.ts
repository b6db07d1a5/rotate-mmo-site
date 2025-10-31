import SupabaseClientWrapper from '@/models/SupabaseClient';
import { User, CreateUserRequest, UpdateUserRequest, UserQueryParams, ApiResponse, PaginationInfo, LoginRequest } from '@/types';
import { ValidationUtils } from '@/utils/validation';
import bcrypt from 'bcryptjs';

export class UserService {
  private pb: SupabaseClientWrapper;

  constructor() {
    this.pb = SupabaseClientWrapper.getInstance();
  }

  async getUsers(queryParams: UserQueryParams): Promise<ApiResponse<User[]>> {
    try {
      const { page = 1, limit = 50, guild, search, sort_by = 'created', sort_order = 'desc' } = queryParams;

      const paginationValidation = ValidationUtils.validatePaginationParams(page, limit);
      if (!paginationValidation.isValid) {
        return {
          success: false,
          error: paginationValidation.errors.join(', ')
        };
      }

      const sortValidation = ValidationUtils.validateSortParams(sort_by, sort_order, ['username', 'created', 'stats.reports_count']);
      if (!sortValidation.isValid) {
        return {
          success: false,
          error: sortValidation.errors.join(', ')
        };
      }

      const filter: any = {};
      if (guild) filter.guild = guild;
      if (search) {
        filter.username = { $like: `%${search}%` };
      }

      const sort = `${sort_order === 'desc' ? '-' : ''}${sort_by}`;

      const result = await this.pb.getUsers({
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
        error: 'Failed to fetch users'
      };
    }
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const user = await this.pb.getUser(id);
      // Remove password from response
      delete user.password;
      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: 'User not found'
      };
    }
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const validation = ValidationUtils.validateUserData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Check if username already exists
      const existingUser = await this.pb.getUsers({
        filter: { username: data.username },
        perPage: 1
      });

      if (existingUser.items.length > 0) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }

      // Check if email already exists
      const existingEmail = await this.pb.getUsers({
        filter: { email: data.email },
        perPage: 1
      });

      if (existingEmail.items.length > 0) {
        return {
          success: false,
          error: 'Email already exists'
        };
      }

      // For Supabase, user creation uses auth.signUp which also creates the profile
      // The register method handles both auth and profile creation
      const userData = {
        username: ValidationUtils.sanitizeString(data.username),
        email: data.email.toLowerCase(),
        password: data.password,
        passwordConfirm: data.password // Supabase doesn't need separate confirm in signUp
      };

      const result = await this.pb.register(
        userData.email,
        userData.password,
        userData.passwordConfirm,
        userData.username
      );

      const user = result.record || result.user;
      // Remove password from response
      if (user) {
        delete user.password;
      }

      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user'
      };
    }
  }

  async updateUser(id: string, data: UpdateUserRequest, userId: string): Promise<ApiResponse<User>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const existingUser = await this.pb.getUser(id);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if user has permission to update (self or admin)
      if (existingUser.id !== userId && existingUser.role !== 'admin') {
        return {
          success: false,
          error: 'Insufficient permissions to update this user'
        };
      }

      const validation = ValidationUtils.validateUserData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Validate notification settings if provided
      if (data.notification_settings) {
        const notificationValidation = ValidationUtils.validateNotificationSettings(data.notification_settings);
        if (!notificationValidation.isValid) {
          return {
            success: false,
            error: notificationValidation.errors.join(', ')
          };
        }
      }

      const updateData: any = {};
      
      if (data.username) {
        // Check if new username already exists
        const existingUsername = await this.pb.getUsers({
          filter: { username: data.username },
          perPage: 1
        });

        if (existingUsername.items.length > 0 && existingUsername.items[0].id !== id) {
          return {
            success: false,
            error: 'Username already exists'
          };
        }
        updateData.username = ValidationUtils.sanitizeString(data.username);
      }
      
      if (data.email) {
        // Check if new email already exists
        const existingEmail = await this.pb.getUsers({
          filter: { email: data.email },
          perPage: 1
        });

        if (existingEmail.items.length > 0 && existingEmail.items[0].id !== id) {
          return {
            success: false,
            error: 'Email already exists'
          };
        }
        updateData.email = data.email.toLowerCase();
      }
      
      if (data.favorite_bosses) updateData.favorite_bosses = data.favorite_bosses;
      if (data.notification_settings) updateData.notification_settings = data.notification_settings;
      if (data.guild) updateData.guild = data.guild;
      if (data.avatar) updateData.avatar = data.avatar;
      if (data.bio) updateData.bio = ValidationUtils.sanitizeString(data.bio);

      const user = await this.pb.updateUser(id, updateData);
      // Remove password from response
      delete user.password;
      return {
        success: true,
        data: user,
        message: 'User updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user'
      };
    }
  }

  async deleteUser(id: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const existingUser = await this.pb.getUser(id);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if user has permission to delete (self or admin)
      if (existingUser.id !== userId && existingUser.role !== 'admin') {
        return {
          success: false,
          error: 'Insufficient permissions to delete this user'
        };
      }

      await this.pb.deleteUser(id);
      return {
        success: true,
        data: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete user'
      };
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const validation = ValidationUtils.validateUserData(credentials);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const authResult = await this.pb.authWithPassword(credentials.email, credentials.password);
      const user = authResult.user;
      const token = authResult.session?.access_token;

      // Get full user profile from users table
      let userProfile = null;
      if (user?.id) {
        const { data } = await this.pb.getUser(user.id).catch(() => ({ data: null }));
        userProfile = data;
      }

      // Remove password from response
      const responseUser = userProfile || user;
      if (responseUser) {
        delete responseUser.password;
      }

      return {
        success: true,
        data: { user: responseUser, token },
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
  }

  async logout(): Promise<ApiResponse<boolean>> {
    try {
      await this.pb.logout();
      return {
        success: true,
        data: true,
        message: 'Logout successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to logout'
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const user = await this.pb.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user'
        };
      }

      // Get full user profile from users table
      let userProfile = null;
      if (user?.id) {
        const { data } = await this.pb.getUser(user.id).catch(() => ({ data: null }));
        userProfile = data;
      }

      // Remove password from response
      const responseUser = userProfile || user;
      if (responseUser) {
        delete responseUser.password;
      }

      return {
        success: true,
        data: responseUser
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get current user'
      };
    }
  }

  async addFavoriteBoss(userId: string, bossId: string): Promise<ApiResponse<User>> {
    try {
      if (!userId || !bossId) {
        return {
          success: false,
          error: 'User ID and Boss ID are required'
        };
      }

      const user = await this.pb.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if boss exists
      const boss = await this.pb.getBoss(bossId);
      if (!boss) {
        return {
          success: false,
          error: 'Boss not found'
        };
      }

      // Check if boss is already in favorites
      if (user.favorite_bosses.includes(bossId)) {
        return {
          success: false,
          error: 'Boss is already in favorites'
        };
      }

      const updatedFavorites = [...user.favorite_bosses, bossId];
      const updatedUser = await this.pb.updateUser(userId, {
        favorite_bosses: updatedFavorites,
        stats: {
          ...user.stats,
          favorite_bosses_count: updatedFavorites.length
        }
      });

      // Remove password from response
      delete updatedUser.password;
      return {
        success: true,
        data: updatedUser,
        message: 'Boss added to favorites'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add boss to favorites'
      };
    }
  }

  async removeFavoriteBoss(userId: string, bossId: string): Promise<ApiResponse<User>> {
    try {
      if (!userId || !bossId) {
        return {
          success: false,
          error: 'User ID and Boss ID are required'
        };
      }

      const user = await this.pb.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if boss is in favorites
      if (!user.favorite_bosses.includes(bossId)) {
        return {
          success: false,
          error: 'Boss is not in favorites'
        };
      }

      const updatedFavorites = user.favorite_bosses.filter(id => id !== bossId);
      const updatedUser = await this.pb.updateUser(userId, {
        favorite_bosses: updatedFavorites,
        stats: {
          ...user.stats,
          favorite_bosses_count: updatedFavorites.length
        }
      });

      // Remove password from response
      delete updatedUser.password;
      return {
        success: true,
        data: updatedUser,
        message: 'Boss removed from favorites'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to remove boss from favorites'
      };
    }
  }

  async getUserStats(userId: string): Promise<ApiResponse<any>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      const user = await this.pb.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get user's spawn events
      const spawnEvents = await this.pb.getSpawnEvents({
        filter: { reported_by: userId },
        sort: '-spawn_time'
      });

      const stats = {
        ...user.stats,
        total_spawn_reports: spawnEvents.totalItems,
        verified_reports: spawnEvents.items.filter(event => event.verified).length,
        recent_reports: spawnEvents.items.slice(0, 10),
        favorite_bosses_count: user.favorite_bosses.length,
        guild: user.guild,
        member_since: user.created,
        last_login: user.last_login
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user statistics'
      };
    }
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters long'
        };
      }

      const result = await this.pb.getUsers({
        filter: {
          $or: [
            { username: { $like: `%${query}%` } },
            { email: { $like: `%${query}%` } }
          ]
        },
        sort: 'username',
        perPage: 20
      });

      // Remove passwords from response
      const users = result.items.map(user => {
        delete user.password;
        return user;
      });

      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search users'
      };
    }
  }
}
