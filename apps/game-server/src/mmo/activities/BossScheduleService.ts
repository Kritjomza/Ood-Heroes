export type ScheduledBossEvent = {
  eventId: string;
  zoneId: string;
  bossId: string;
  startAtMs: number;
  totalHp: number;
};

export type BossScheduleServiceOptions = {
  periodMs?: number;
  firstStartAtMs?: number;
  leadTimeMs?: number;
  totalHp?: number;
};

/** Published, deterministic UTC schedule. Each channel materializes the same event independently. */
export class BossScheduleService {
  private readonly periodMs: number;
  private readonly firstStartAtMs: number;
  private readonly leadTimeMs: number;
  private readonly totalHp: number;

  constructor(options: BossScheduleServiceOptions = {}) {
    this.periodMs = options.periodMs ?? 60 * 60 * 1_000;
    this.firstStartAtMs = options.firstStartAtMs ?? Date.UTC(2026, 0, 1, 0, 0, 0);
    this.leadTimeMs = options.leadTimeMs ?? 15 * 60 * 1_000;
    this.totalHp = options.totalHp ?? 5_000;
    if (![this.periodMs, this.leadTimeMs, this.totalHp].every((value) => Number.isFinite(value) && value > 0))
      throw new Error('invalid_boss_schedule');
  }

  nextEvent(zoneId: string, nowMs: number): ScheduledBossEvent {
    if (!zoneId || !Number.isFinite(nowMs)) throw new Error('invalid_boss_schedule_request');
    const slot = Math.max(0, Math.ceil((nowMs - this.firstStartAtMs) / this.periodMs));
    const startAtMs = this.firstStartAtMs + slot * this.periodMs;
    return {
      eventId: `${zoneId}:scheduled:${startAtMs}`,
      zoneId,
      bossId: `${zoneId}:world-boss`,
      startAtMs,
      totalHp: this.totalHp,
    };
  }

  countdown(eventId: string, nowMs: number) {
    const startAtMs = Number(eventId.split(':').at(-1));
    if (!Number.isFinite(startAtMs) || !Number.isFinite(nowMs)) throw new Error('invalid_boss_event');
    return Math.max(0, startAtMs - nowMs);
  }

  isAnnounced(event: ScheduledBossEvent, nowMs: number) {
    return nowMs >= event.startAtMs - this.leadTimeMs && nowMs < event.startAtMs;
  }
}
