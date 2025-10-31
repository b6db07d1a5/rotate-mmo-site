import { Boss, SpawnEvent, User, CreateBossRequest, CreateSpawnEventRequest } from '@/types';

export class ValidationUtils {
  static validateBossData(data: CreateBossRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Boss name is required');
    }

    if (data.level < 1 || data.level > 1000) {
      errors.push('Boss level must be between 1 and 1000');
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push('Boss location is required');
    }

    if (data.respawn_time < 1 || data.respawn_time > 10080) {
      errors.push('Respawn time must be between 1 minute and 1 week');
    }

    if (!data.server || data.server.trim().length === 0) {
      errors.push('Server is required');
    }

    if (!data.difficulty) {
      errors.push('Difficulty is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateSpawnEventData(data: CreateSpawnEventRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.boss_id || data.boss_id.trim().length === 0) {
      errors.push('Boss ID is required');
    }

    if (!data.spawn_time) {
      errors.push('Spawn time is required');
    } else {
      const spawnTime = new Date(data.spawn_time);
      
      // Validate that spawn_time is a valid date
      if (isNaN(spawnTime.getTime())) {
        errors.push('Spawn time must be a valid date');
      }
      
      // Allow future dates (for scheduling boss spawns before they actually occur)
      // Only check that it's not too far in the past (e.g., more than 30 days ago)
      const now = new Date();
      const maxPastTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      if (spawnTime < maxPastTime) {
        errors.push('Spawn time cannot be more than 30 days ago');
      }
    }

    if (!data.server || data.server.trim().length === 0) {
      errors.push('Server is required');
    }

    if (data.coordinates) {
      if (typeof data.coordinates.x !== 'number' || typeof data.coordinates.y !== 'number') {
        errors.push('Coordinates must have valid x and y values');
      }
      
      if (data.coordinates.z !== undefined && typeof data.coordinates.z !== 'number') {
        errors.push('Z coordinate must be a number if provided');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUserData(data: Partial<User>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.username !== undefined) {
      if (!data.username || data.username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
      
      if (data.username.length > 50) {
        errors.push('Username cannot exceed 50 characters');
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Email validation removed - email is handled internally only

    if (data.bio !== undefined && data.bio.length > 500) {
      errors.push('Bio cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateCoordinates(coordinates: any): boolean {
    if (!coordinates || typeof coordinates !== 'object') return false;
    
    return (
      typeof coordinates.x === 'number' &&
      typeof coordinates.y === 'number' &&
      (coordinates.z === undefined || typeof coordinates.z === 'number')
    );
  }

  static validateNotificationSettings(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.notification_timing) {
      if (!Array.isArray(settings.notification_timing)) {
        errors.push('Notification timing must be an array');
      } else {
        settings.notification_timing.forEach((timing: any, index: number) => {
          if (!timing.type || !['minutes', 'seconds'].includes(timing.type)) {
            errors.push(`Notification timing ${index + 1}: type must be 'minutes' or 'seconds'`);
          }
          
          if (typeof timing.value !== 'number' || timing.value < 1 || timing.value > 300) {
            errors.push(`Notification timing ${index + 1}: value must be between 1 and 300`);
          }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static validateServerName(server: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(server) && server.length >= 1 && server.length <= 50;
  }

  static validateDifficulty(difficulty: string): boolean {
    return ['easy', 'medium', 'hard', 'extreme', 'legendary'].includes(difficulty);
  }

  static validateRespawnTime(time: number): boolean {
    return Number.isInteger(time) && time >= 1 && time <= 10080;
  }

  static validateLevel(level: number): boolean {
    return Number.isInteger(level) && level >= 1 && level <= 1000;
  }

  static validatePaginationParams(page: number, limit: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isInteger(page) || page < 1 || page > 1000) {
      errors.push('Page must be an integer between 1 and 1000');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be an integer between 1 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateSortParams(sortBy: string, sortOrder: string, allowedFields: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (sortBy && !allowedFields.includes(sortBy)) {
      errors.push(`Sort field must be one of: ${allowedFields.join(', ')}`);
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      errors.push('Sort order must be either "asc" or "desc"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
