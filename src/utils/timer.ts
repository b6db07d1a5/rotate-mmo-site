import moment from 'moment';
import { RespawnTimer, Boss, SpawnEvent } from '@/types';

export class TimerUtils {
  static calculateNextSpawn(boss: Boss, lastSpawnEvent?: SpawnEvent): string {
    const baseRespawnTime = boss.respawn_time; // in minutes
    let lastSpawn: moment.Moment;

    if (lastSpawnEvent) {
      lastSpawn = moment(lastSpawnEvent.spawn_time);
    } else if (boss.last_spawn) {
      lastSpawn = moment(boss.last_spawn);
    } else {
      return moment().add(baseRespawnTime, 'minutes').toISOString();
    }

    return lastSpawn.add(baseRespawnTime, 'minutes').toISOString();
  }

  static calculateTimeRemaining(nextSpawn: string): number {
    const now = moment();
    const nextSpawnTime = moment(nextSpawn);
    const diff = nextSpawnTime.diff(now, 'seconds');
    return Math.max(0, diff);
  }

  static isBossActive(boss: Boss): boolean {
    if (!boss.next_spawn) return false;
    return moment().isBefore(moment(boss.next_spawn));
  }

  static getRespawnTimer(boss: Boss, lastSpawnEvent?: SpawnEvent): RespawnTimer {
    const nextSpawn = this.calculateNextSpawn(boss, lastSpawnEvent);
    const timeRemaining = this.calculateTimeRemaining(nextSpawn);
    const isActive = this.isBossActive(boss);

    return {
      boss_id: boss.id,
      boss_name: boss.name,
      server: boss.server,
      last_spawn: boss.last_spawn || '',
      next_spawn: nextSpawn,
      time_remaining: timeRemaining,
      is_active: isActive,
      notifications_sent: []
    };
  }

  static formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static getTimeUntilNotification(nextSpawn: string, notificationTiming: { type: string; value: number }): number {
    const nextSpawnTime = moment(nextSpawn);
    const notificationTime = nextSpawnTime.subtract(notificationTiming.value, notificationTiming.type as moment.unitOfTime.DurationConstructor);
    const now = moment();
    
    return notificationTime.diff(now, 'seconds');
  }

  static shouldSendNotification(nextSpawn: string, notificationTiming: { type: string; value: number }, sentNotifications: any[]): boolean {
    const timeUntilNotification = this.getTimeUntilNotification(nextSpawn, notificationTiming);
    const notificationKey = `${notificationTiming.type}_${notificationTiming.value}`;
    
    return timeUntilNotification <= 0 && !sentNotifications.includes(notificationKey);
  }

  static calculateSpawnAccuracy(boss: Boss, spawnEvents: SpawnEvent[]): number {
    if (spawnEvents.length < 2) return 0;

    const actualIntervals: number[] = [];
    const sortedEvents = spawnEvents.sort((a, b) => moment(a.spawn_time).diff(moment(b.spawn_time)));

    for (let i = 1; i < sortedEvents.length; i++) {
      const interval = moment(sortedEvents[i].spawn_time).diff(moment(sortedEvents[i - 1].spawn_time), 'minutes');
      actualIntervals.push(interval);
    }

    const averageInterval = actualIntervals.reduce((sum, interval) => sum + interval, 0) / actualIntervals.length;
    const expectedInterval = boss.respawn_time;
    const accuracy = Math.max(0, 100 - Math.abs(averageInterval - expectedInterval) / expectedInterval * 100);

    return Math.round(accuracy);
  }

  static predictSpawnTimes(boss: Boss, spawnEvents: SpawnEvent[], count: number = 5): string[] {
    const predictions: string[] = [];
    const lastEvent = spawnEvents.sort((a, b) => moment(b.spawn_time).diff(moment(a.spawn_time)))[0];
    
    if (!lastEvent) return predictions;

    let lastSpawn = moment(lastEvent.spawn_time);
    
    for (let i = 0; i < count; i++) {
      lastSpawn = lastSpawn.add(boss.respawn_time, 'minutes');
      predictions.push(lastSpawn.toISOString());
    }

    return predictions;
  }

  static getSpawnWindows(boss: Boss, spawnEvents: SpawnEvent[]): { start: string; end: string; confidence: number }[] {
    const windows: { start: string; end: string; confidence: number }[] = [];
    
    if (spawnEvents.length < 3) return windows;

    const intervals: number[] = [];
    const sortedEvents = spawnEvents.sort((a, b) => moment(a.spawn_time).diff(moment(b.spawn_time)));

    for (let i = 1; i < sortedEvents.length; i++) {
      const interval = moment(sortedEvents[i].spawn_time).diff(moment(sortedEvents[i - 1].spawn_time), 'minutes');
      intervals.push(interval);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - averageInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);

    const lastEvent = sortedEvents[sortedEvents.length - 1];
    let nextSpawn = moment(lastEvent.spawn_time).add(averageInterval, 'minutes');

    for (let i = 0; i < 3; i++) {
      const windowStart = nextSpawn.subtract(standardDeviation, 'minutes');
      const windowEnd = nextSpawn.add(standardDeviation, 'minutes');
      const confidence = Math.max(0, 100 - standardDeviation / averageInterval * 100);

      windows.push({
        start: windowStart.toISOString(),
        end: windowEnd.toISOString(),
        confidence: Math.round(confidence)
      });

      nextSpawn = nextSpawn.add(averageInterval, 'minutes');
    }

    return windows;
  }
}
