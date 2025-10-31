// Base types
export interface BaseEntity {
  id: string;
  created: string;
  updated: string;
}

// Boss related types
export interface Boss extends BaseEntity {
  name: string;
  level: number;
  location: string;
  respawn_time: number; // in minutes
  last_spawn?: string;
  next_spawn?: string;
  server: string;
  image?: string;
  description?: string;
  difficulty: BossDifficulty;
  created_by: string;
  verified: boolean;
  tags?: string[];
  drops?: string[];
  requirements?: string[];
}

export enum BossDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme',
  LEGENDARY = 'legendary'
}

// Spawn Event types
export interface SpawnEvent extends BaseEntity {
  boss_id: string;
  spawn_time: string;
  reported_by: string;
  verified: boolean;
  server: string;
  notes?: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number;
  };
  participants?: string[];
  kill_time?: string;
}

// User types
export interface User extends BaseEntity {
  username: string;
  password?: string; // Only for creation, not returned in responses
  favorite_bosses: string[];
  notification_settings: NotificationSettings;
  guild?: string;
  stats: UserStats;
  avatar?: string;
  bio?: string;
  is_active: boolean;
  last_login?: string;
}

export interface NotificationSettings {
  push_notifications: boolean;
  notification_timing: NotificationTiming[];
  guild_notifications: boolean;
  rare_boss_alerts: boolean;
}

export interface NotificationTiming {
  type: 'minutes' | 'seconds';
  value: number;
}

export interface UserStats {
  reports_count: number;
  verified_reports: number;
  accuracy_rate: number;
  favorite_bosses_count: number;
  guild_rank?: number;
  achievements: string[];
}

// Community types
export interface Comment extends BaseEntity {
  boss_id: string;
  user_id: string;
  content: string;
  likes: number;
  replies?: string[];
  parent_id?: string;
  is_deleted: boolean;
}

export interface Guild extends BaseEntity {
  name: string;
  description?: string;
  leader_id: string;
  members: string[];
  boss_tracking_enabled: boolean;
  notification_channel?: string;
  stats: GuildStats;
}

export interface GuildStats {
  total_members: number;
  active_members: number;
  boss_kills: number;
  accuracy_rate: number;
}

// Guild Member Contribution types
export interface GuildMemberContribution extends BaseEntity {
  guild_id: string;
  member_name: string;
  member_id?: string; // Optional reference to user ID
  contribution_score: number; // Number of events joined
  last_event_date?: string; // Date of last event participation
}

export interface CreateGuildMemberContributionRequest {
  guild_id: string;
  member_name: string;
  member_id?: string;
}

export interface UpdateGuildMemberContributionRequest {
  member_name?: string;
  contribution_score?: number;
}

export interface GuildMemberContributionQueryParams {
  page?: number;
  limit?: number;
  guild_id?: string;
  member_name?: string;
  sort_by?: 'member_name' | 'contribution_score' | 'created';
  sort_order?: 'asc' | 'desc';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request types
export interface CreateBossRequest {
  name: string;
  level: number;
  location: string;
  respawn_time: number;
  server: string;
  description?: string;
  difficulty: BossDifficulty;
  tags?: string[];
  drops?: string[];
  requirements?: string[];
}

export interface UpdateBossRequest extends Partial<CreateBossRequest> {
  verified?: boolean;
}

export interface CreateSpawnEventRequest {
  boss_id: string;
  spawn_time: string;
  server: string;
  notes?: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number;
  };
}

export interface UpdateSpawnEventRequest extends Partial<CreateSpawnEventRequest> {
  verified?: boolean;
  kill_time?: string;
  participants?: string[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  guild?: string;
}

export interface UpdateUserRequest {
  username?: string;
  favorite_bosses?: string[];
  notification_settings?: NotificationSettings;
  guild?: string;
  avatar?: string;
  bio?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest extends CreateUserRequest {}

// Query parameters
export interface BossQueryParams {
  page?: number;
  limit?: number;
  server?: string;
  difficulty?: BossDifficulty;
  verified?: boolean;
  search?: string;
  sort_by?: 'name' | 'level' | 'respawn_time' | 'created';
  sort_order?: 'asc' | 'desc';
}

export interface SpawnEventQueryParams {
  page?: number;
  limit?: number;
  boss_id?: string;
  server?: string;
  verified?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  guild?: string;
  search?: string;
  sort_by?: 'username' | 'created' | 'stats.reports_count';
  sort_order?: 'asc' | 'desc';
}

// Timer and notification types
export interface RespawnTimer {
  boss_id: string;
  boss_name: string;
  server: string;
  last_spawn: string;
  next_spawn: string;
  time_remaining: number; // in seconds
  is_active: boolean;
  notifications_sent: NotificationTiming[];
}

export interface NotificationEvent {
  id: string;
  user_id: string;
  boss_id: string;
  type: 'spawn_alert' | 'guild_notification' | 'achievement';
  message: string;
  scheduled_for: string;
  sent: boolean;
  sent_at?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Socket events
export interface SocketEvents {
  'boss:spawn': SpawnEvent;
  'boss:update': Boss;
  'timer:update': RespawnTimer;
  'notification:new': NotificationEvent;
  'guild:update': Guild;
}

// Configuration types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    serviceRoleKey: string;
    anonKey: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  cors: {
    origin: string[];
  };
  redis: {
    url: string;
  };
  logging: {
    level: string;
    file: string;
  };
}
