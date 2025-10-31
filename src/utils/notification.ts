import { NotificationEvent, User, Boss, RespawnTimer } from '@/types';

export class NotificationUtils {
  static formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'BOSS SPAWNED!';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  static shouldSendNotification(user: User, boss: Boss, timer: RespawnTimer, timing: { type: string; value: number }): boolean {
    if (!user.notification_settings.push_notifications) return false;

    const timeUntilNotification = this.getTimeUntilNotification(timer.next_spawn, timing);
    return timeUntilNotification <= 0;
  }

  static getTimeUntilNotification(nextSpawn: string, timing: { type: string; value: number }): number {
    const now = new Date();
    const nextSpawnTime = new Date(nextSpawn);
    const notificationTime = new Date(nextSpawnTime.getTime() - (timing.value * (timing.type === 'minutes' ? 60000 : 1000)));
    
    return notificationTime.getTime() - now.getTime();
  }

  static createNotificationEvent(userId: string, bossId: string, type: string, message: string, scheduledFor: string): NotificationEvent {
    return {
      id: this.generateId(),
      user_id: userId,
      boss_id: bossId,
      type: type as any,
      message,
      scheduled_for: scheduledFor,
      sent: false
    };
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static async sendPushNotification(user: User, boss: Boss, timer: RespawnTimer): Promise<boolean> {
    try {
      if (!user.notification_settings.push_notifications) {
        return false;
      }

      // This would integrate with a push notification service like Firebase
      // For now, we'll just log the notification
      console.log(`Push notification sent to user ${user.id} for boss ${boss.name}`);
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  static async sendGuildNotification(guildMembers: User[], boss: Boss, timer: RespawnTimer): Promise<number> {
    let sentCount = 0;

    for (const member of guildMembers) {
      if (member.notification_settings.guild_notifications) {
        // Send push notification instead of email
        const success = await this.sendPushNotification(member, boss, timer);
        if (success) sentCount++;
      }
    }

    return sentCount;
  }

  static async sendDiscordNotification(webhookUrl: string, boss: Boss, timer: RespawnTimer): Promise<boolean> {
    try {
      const embed = {
        title: `Boss Spawn Alert: ${boss.name}`,
        description: `The boss **${boss.name}** is expected to spawn soon!`,
        color: 0xe74c3c,
        fields: [
          {
            name: 'Level',
            value: boss.level.toString(),
            inline: true
          },
          {
            name: 'Location',
            value: boss.location,
            inline: true
          },
          {
            name: 'Server',
            value: boss.server,
            inline: true
          },
          {
            name: 'Time Remaining',
            value: this.formatTimeRemaining(timer.time_remaining),
            inline: false
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Boss Respawn Tracker'
        }
      };

      // This would send a webhook to Discord
      // For now, we'll just log the notification
      console.log(`Discord notification sent for boss ${boss.name}`);
      return true;
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      return false;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
