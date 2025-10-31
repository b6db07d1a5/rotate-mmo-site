import SupabaseClientWrapper from '@/models/SupabaseClient';
import { User, CreateUserRequest, UpdateUserRequest, UserQueryParams, ApiResponse, PaginationInfo, LoginRequest } from '@/types';
import { ValidationUtils } from '@/utils/validation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@/config';

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
      // Remove password and email from response (email is internal only)
      delete user.password;
      delete user.email;
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

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Generate UUID for user ID
      const { v4: uuidv4 } = await import('uuid');
      const userId = uuidv4();
      
      // Create user profile directly in users table (no Supabase Auth needed)
      const userData = {
        id: userId,
        username: ValidationUtils.sanitizeString(data.username),
        password: hashedPassword, // Store hashed password
        favorite_bosses: [],
        notification_settings: {
          push_notifications: true,
          notification_timing: [],
          guild_notifications: false,
          rare_boss_alerts: false
        },
        stats: {
          reports_count: 0,
          verified_reports: 0,
          accuracy_rate: 0,
          favorite_bosses_count: 0,
          achievements: []
        },
        is_active: true
      };

      // Add guild if provided
      if (data.guild) {
        (userData as any).guild = data.guild;
      }

      // Insert user directly into users table
      const user = await this.pb.createUser(userData);
      
      // Remove password from response
      if (user) {
        delete user.password;
      }

      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };
    } catch (error: any) {
      // Return more detailed error message
      let errorMessage = 'Failed to create user';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.originalError?.message) {
        errorMessage = error.originalError.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Return error message

      return {
        success: false,
        error: errorMessage
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
      
      // Email cannot be updated - it's auto-generated internally
      
      if (data.favorite_bosses) updateData.favorite_bosses = data.favorite_bosses;
      if (data.notification_settings) updateData.notification_settings = data.notification_settings;
      if (data.guild) updateData.guild = data.guild;
      if (data.avatar) updateData.avatar = data.avatar;
      if (data.bio) updateData.bio = ValidationUtils.sanitizeString(data.bio);

      const user = await this.pb.updateUser(id, updateData);
      // Remove password and email from response (email is internal only)
      delete user.password;
      delete user.email;
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
      // Validate login credentials (username and password only)
      const errors: string[] = [];
      if (!credentials.username || credentials.username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
      if (credentials.username && credentials.username.length > 50) {
        errors.push('Username cannot exceed 50 characters');
      }
      if (credentials.username && !/^[a-zA-Z0-9_-]+$/.test(credentials.username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
      if (!credentials.password) {
        errors.push('Password is required');
      }
      
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(', ')
        };
      }

      // Find user by username
      const users = await this.pb.getUsers({
        filter: { username: credentials.username },
        perPage: 1
      });

      if (users.items.length === 0) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const user = users.items[0];
      
      // Verify password
      if (!user.password) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Generate JWT token
      const jwtSecret = config.jwt.secret || 'your-secret-key';
      const expiresIn = config.jwt.expiresIn || '24h';
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username 
        },
        jwtSecret,
        { expiresIn } as jwt.SignOptions
      );

      // Remove password from response
      const responseUser = { ...user };
      delete responseUser.password;

      return {
        success: true,
        data: { user: responseUser, token },
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }
  }

  async logout(): Promise<ApiResponse<boolean>> {
    // With JWT, logout is handled client-side by removing the token
    // Server-side logout not needed (stateless JWT)
    return {
      success: true,
      data: true,
      message: 'Logout successful'
    };
  }

  async getCurrentUser(userId: string): Promise<ApiResponse<User>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID required'
        };
      }

      // Get full user profile from users table
      const user = await this.pb.getUser(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        data: userWithoutPassword
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

      // Remove password and email from response (email is internal only)
      delete updatedUser.password;
      delete updatedUser.email;
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

      const updatedFavorites = user.favorite_bosses.filter((id: string) => id !== bossId);
      const updatedUser = await this.pb.updateUser(userId, {
        favorite_bosses: updatedFavorites,
        stats: {
          ...user.stats,
          favorite_bosses_count: updatedFavorites.length
        }
      });

      // Remove password and email from response (email is internal only)
      delete updatedUser.password;
      delete updatedUser.email;
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
        verified_reports: spawnEvents.items.filter((event: any) => event.verified).length,
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
          username: { $like: `%${query}%` }
        },
        sort: 'username',
        perPage: 20
      });

      // Remove passwords and emails from response (email is internal only)
      const users = result.items.map((user: any) => {
        const { password, email, ...sanitizedUser } = user;
        return sanitizedUser;
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
