import nodemailer from 'nodemailer';
import config from '@/config';
import { NotificationEvent, User, Boss, RespawnTimer } from '@/types';

export class NotificationUtils {
  private static transporter = nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  static async sendEmailNotification(user: User, boss: Boss, timer: RespawnTimer, timing: { type: string; value: number }): Promise<boolean> {
    try {
      if (!user.notification_settings.email_notifications) {
        return false;
      }

      const timeRemaining = this.formatTimeRemaining(timer.time_remaining);
      const subject = `Boss Spawn Alert: ${boss.name}`;
      const html = this.generateEmailTemplate(boss, timer, timing, timeRemaining);

      await this.transporter.sendMail({
        from: config.email.user,
        to: user.email,
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  static async sendGuildNotification(guildMembers: User[], boss: Boss, timer: RespawnTimer): Promise<number> {
    let sentCount = 0;

    for (const member of guildMembers) {
      if (member.notification_settings.guild_notifications) {
        const success = await this.sendEmailNotification(member, boss, timer, { type: 'minutes', value: 5 });
        if (success) sentCount++;
      }
    }

    return sentCount;
  }

  static generateEmailTemplate(boss: Boss, timer: RespawnTimer, timing: { type: string; value: number }, timeRemaining: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Boss Spawn Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .boss-info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #e74c3c; }
          .timer { font-size: 24px; font-weight: bold; color: #e74c3c; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 Boss Spawn Alert</h1>
          </div>
          <div class="content">
            <div class="boss-info">
              <h2>${boss.name}</h2>
              <p><strong>Level:</strong> ${boss.level}</p>
              <p><strong>Location:</strong> ${boss.location}</p>
              <p><strong>Server:</strong> ${boss.server}</p>
              <p><strong>Difficulty:</strong> ${boss.difficulty}</p>
            </div>
            <div class="timer">
              ${timeRemaining}
            </div>
            <p>The boss <strong>${boss.name}</strong> is expected to spawn in <strong>${timing.value} ${timing.type}</strong>!</p>
            <p>Make sure you're ready and in position!</p>
            <a href="#" class="button">View Boss Details</a>
          </div>
          <div class="footer">
            <p>This notification was sent because you have boss spawn alerts enabled.</p>
            <p>You can manage your notification settings in your account preferences.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

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
    if (!user.notification_settings.email_notifications) return false;

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

  static async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}
