import PocketBase from 'pocketbase';
import config from '@/config';

class PocketBaseClient {
  private static instance: PocketBaseClient;
  private pb: PocketBase;

  private constructor() {
    this.pb = new PocketBase(config.pocketbase.url);
    this.initializeAuth();
  }

  public static getInstance(): PocketBaseClient {
    if (!PocketBaseClient.instance) {
      PocketBaseClient.instance = new PocketBaseClient();
    }
    return PocketBaseClient.instance;
  }

  private async initializeAuth(): Promise<void> {
    try {
      await this.pb.admins.authWithPassword(
        config.pocketbase.adminEmail,
        config.pocketbase.adminPassword
      );
      console.log('PocketBase admin authentication successful');
    } catch (error) {
      console.error('PocketBase admin authentication failed:', error);
    }
  }

  public getClient(): PocketBase {
    return this.pb;
  }

  // Boss collection methods
  public async getBosses(queryParams?: any): Promise<any> {
    return this.pb.collection('bosses').getList(queryParams?.page || 1, queryParams?.limit || 50, queryParams);
  }

  public async getBoss(id: string): Promise<any> {
    return this.pb.collection('bosses').getOne(id);
  }

  public async createBoss(data: any): Promise<any> {
    return this.pb.collection('bosses').create(data);
  }

  public async updateBoss(id: string, data: any): Promise<any> {
    return this.pb.collection('bosses').update(id, data);
  }

  public async deleteBoss(id: string): Promise<boolean> {
    return this.pb.collection('bosses').delete(id);
  }

  // Spawn Event collection methods
  public async getSpawnEvents(queryParams?: any): Promise<any> {
    return this.pb.collection('spawn_events').getList(queryParams?.page || 1, queryParams?.limit || 50, queryParams);
  }

  public async getSpawnEvent(id: string): Promise<any> {
    return this.pb.collection('spawn_events').getOne(id);
  }

  public async createSpawnEvent(data: any): Promise<any> {
    return this.pb.collection('spawn_events').create(data);
  }

  public async updateSpawnEvent(id: string, data: any): Promise<any> {
    return this.pb.collection('spawn_events').update(id, data);
  }

  public async deleteSpawnEvent(id: string): Promise<boolean> {
    return this.pb.collection('spawn_events').delete(id);
  }

  // User collection methods
  public async getUsers(queryParams?: any): Promise<any> {
    return this.pb.collection('users').getList(queryParams?.page || 1, queryParams?.limit || 50, queryParams);
  }

  public async getUser(id: string): Promise<any> {
    return this.pb.collection('users').getOne(id);
  }

  public async createUser(data: any): Promise<any> {
    return this.pb.collection('users').create(data);
  }

  public async updateUser(id: string, data: any): Promise<any> {
    return this.pb.collection('users').update(id, data);
  }

  public async deleteUser(id: string): Promise<boolean> {
    return this.pb.collection('users').delete(id);
  }

  // Comment collection methods
  public async getComments(queryParams?: any): Promise<any> {
    return this.pb.collection('comments').getList(queryParams?.page || 1, queryParams?.limit || 50, queryParams);
  }

  public async getComment(id: string): Promise<any> {
    return this.pb.collection('comments').getOne(id);
  }

  public async createComment(data: any): Promise<any> {
    return this.pb.collection('comments').create(data);
  }

  public async updateComment(id: string, data: any): Promise<any> {
    return this.pb.collection('comments').update(id, data);
  }

  public async deleteComment(id: string): Promise<boolean> {
    return this.pb.collection('comments').delete(id);
  }

  // Guild collection methods
  public async getGuilds(queryParams?: any): Promise<any> {
    return this.pb.collection('guilds').getList(queryParams?.page || 1, queryParams?.limit || 50, queryParams);
  }

  public async getGuild(id: string): Promise<any> {
    return this.pb.collection('guilds').getOne(id);
  }

  public async createGuild(data: any): Promise<any> {
    return this.pb.collection('guilds').create(data);
  }

  public async updateGuild(id: string, data: any): Promise<any> {
    return this.pb.collection('guilds').update(id, data);
  }

  public async deleteGuild(id: string): Promise<boolean> {
    return this.pb.collection('guilds').delete(id);
  }

  // File upload methods
  public async uploadFile(collection: string, recordId: string, field: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append(field, file);
    return this.pb.collection(collection).update(recordId, formData);
  }

  // Real-time subscription
  public subscribe(collection: string, callback: (data: any) => void): () => void {
    return this.pb.collection(collection).subscribe('*', callback);
  }

  // Authentication methods
  public async authWithPassword(email: string, password: string): Promise<any> {
    return this.pb.collection('users').authWithPassword(email, password);
  }

  public async register(email: string, password: string, passwordConfirm: string, username: string): Promise<any> {
    return this.pb.collection('users').create({
      email,
      password,
      passwordConfirm,
      username,
    });
  }

  public logout(): void {
    this.pb.authStore.clear();
  }

  public getAuthToken(): string | null {
    return this.pb.authStore.token;
  }

  public getCurrentUser(): any {
    return this.pb.authStore.model;
  }

  public isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }
}

export default PocketBaseClient;
