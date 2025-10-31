import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '@/config';

class SupabaseClientWrapper {
  private static instance: SupabaseClientWrapper;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  public static getInstance(): SupabaseClientWrapper {
    if (!SupabaseClientWrapper.instance) {
      SupabaseClientWrapper.instance = new SupabaseClientWrapper();
    }
    return SupabaseClientWrapper.instance;
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

  // Helper method to build Supabase query from query params
  private buildQuery(table: string, queryParams?: any): any {
    let query = this.supabase.from(table).select('*', { count: 'exact' });

    // Handle filters
    if (queryParams?.filter) {
      const filter = queryParams.filter;
      for (const [key, value] of Object.entries(filter)) {
        // Skip null/undefined values
        if (value === null || value === undefined) continue;
        
        // Handle array values (for 'in' operations)
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Handle operators like { $like: '%text%' }, { '>=': value }, etc.
          if ('$like' in value && typeof value.$like === 'string') {
            const pattern = value.$like.replace(/%/g, '');
            query = query.ilike(key, `%${pattern}%`);
          } else if ('>=' in value) {
            query = query.gte(key, value['>=']);
          } else if ('<=' in value) {
            query = query.lte(key, value['<=']);
          } else if ('>' in value) {
            query = query.gt(key, value['>']);
          } else if ('<' in value) {
            query = query.lt(key, value['<']);
          } else if ('$in' in value) {
            // Ensure value.$in is an array before passing to .in()
            if (Array.isArray(value.$in)) {
              query = query.in(key, value.$in);
            }
          } else if ('$or' in value) {
            // Handle $or operator - convert to Supabase or filter
            const orConditions = value.$or;
            if (Array.isArray(orConditions) && orConditions.length > 0) {
              query = query.or(
                orConditions
                  .map((cond: any) => {
                    const entries = Object.entries(cond);
                    if (entries.length === 0) return '';
                    const [k, v] = entries[0] as [string, unknown];
                    return `${k}.eq.${v}`;
                  })
                  .filter(Boolean)
                  .join(',')
              );
            }
          }
        } else {
          query = query.eq(key, value);
        }
      }
    }

    // Handle sorting
    if (queryParams?.sort) {
      const sort = queryParams.sort;
      const descending = sort.startsWith('-');
      const column = descending ? sort.substring(1) : sort;
      query = query.order(column, { ascending: !descending });
    }

    // Handle pagination
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    query = query.range(from, to);

    return query;
  }

  // Format Supabase response to standard API response format
  private formatResponse(data: any[], count: number | null, page: number, perPage: number) {
    return {
      items: data || [],
      totalItems: count ?? 0,
      page: page,
      perPage: perPage,
      totalPages: count ? Math.ceil(count / perPage) : 0
    };
  }

  // Boss collection methods
  public async getBosses(queryParams?: any): Promise<any> {
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const query = this.buildQuery('bosses', queryParams);
    const { data, error, count } = await query;

    if (error) throw error;
    return this.formatResponse(data, count, page, perPage);
  }

  public async getBoss(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('bosses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async createBoss(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('bosses')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async updateBoss(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('bosses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async deleteBoss(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('bosses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Spawn Event collection methods
  public async getSpawnEvents(queryParams?: any): Promise<any> {
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const query = this.buildQuery('spawn_events', queryParams);
    const { data, error, count } = await query;

    if (error) throw error;
    return this.formatResponse(data, count, page, perPage);
  }

  public async getSpawnEvent(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('spawn_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async createSpawnEvent(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('spawn_events')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async updateSpawnEvent(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('spawn_events')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async deleteSpawnEvent(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('spawn_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // User collection methods
  public async getUsers(queryParams?: any): Promise<any> {
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const query = this.buildQuery('users', queryParams);
    const { data, error, count } = await query;

    if (error) throw error;
    return this.formatResponse(data, count, page, perPage);
  }

  public async getUser(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async createUser(data: any): Promise<any> {
    // Create user directly in users table (no Supabase Auth needed)
    const { data: result, error } = await this.supabase
      .from('users')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async updateUser(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async deleteUser(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Comment collection methods
  public async getComments(queryParams?: any): Promise<any> {
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const query = this.buildQuery('comments', queryParams);
    const { data, error, count } = await query;

    if (error) throw error;
    return this.formatResponse(data, count, page, perPage);
  }

  public async getComment(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async createComment(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('comments')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async updateComment(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('comments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async deleteComment(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Guild collection methods
  public async getGuilds(queryParams?: any): Promise<any> {
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const query = this.buildQuery('guilds', queryParams);
    const { data, error, count } = await query;

    if (error) throw error;
    return this.formatResponse(data, count, page, perPage);
  }

  public async getGuild(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('guilds')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async createGuild(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('guilds')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async updateGuild(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('guilds')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async deleteGuild(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('guilds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Guild Member Contribution collection methods
  public async getGuildMemberContributions(queryParams?: any): Promise<any> {
    const page = queryParams?.page || 1;
    const perPage = queryParams?.perPage || queryParams?.limit || 50;
    const query = this.buildQuery('guild_member_contributions', queryParams);
    const { data, error, count } = await query;

    if (error) throw error;
    return this.formatResponse(data, count, page, perPage);
  }

  public async getGuildMemberContribution(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('guild_member_contributions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  public async createGuildMemberContribution(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('guild_member_contributions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async updateGuildMemberContribution(id: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('guild_member_contributions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  public async deleteGuildMemberContribution(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('guild_member_contributions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // File upload methods
  public async uploadFile(collection: string, recordId: string, field: string, file: File): Promise<any> {
    // For Supabase, file uploads use Storage API
    const fileExt = file.name.split('.').pop();
    const fileName = `${recordId}-${Date.now()}.${fileExt}`;
    const filePath = `${collection}/${fileName}`;

    const { error } = await this.supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (error) throw error;

    // Update record with file URL
    // getPublicUrl returns { data: { publicUrl: string } }
    const urlResult = this.supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    const publicUrl = urlResult.data.publicUrl;

    const { data: result, error: updateError } = await this.supabase
      .from(collection)
      .update({ [field]: publicUrl })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) throw updateError;
    return result;
  }

  // Real-time subscription
  public subscribe(collection: string, callback: (data: any) => void): () => void {
    const channel = this.supabase
      .channel(`${collection}:changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: collection },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // Authentication methods removed - using JWT-only authentication
  // Passwords are hashed with bcrypt and stored in users table
  // JWT tokens are generated in UserService
}

export default SupabaseClientWrapper;

