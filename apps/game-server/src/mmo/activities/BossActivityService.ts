export type BossContribution = {
  accountId: string;
  damage: number;
  lastContributionTick: number;
};

export type BossRewardTier = 'participation' | 'bronze' | 'silver' | 'gold';

export type BossReward = {
  rewardIdentity: string;
  eventId: string;
  accountId: string;
  tier: BossRewardTier;
  premium: boolean;
  contributionShare: number;
};

type BossEvent = {
  eventId: string;
  channelId: string;
  bossId: string;
  totalHp: number;
  status: 'scheduled' | 'active' | 'finished';
  contributions: Map<string, BossContribution>;
};

export type BossEventView = {
  eventId: string;
  channelId: string;
  bossId: string;
  totalHp: number;
  status: BossEvent['status'];
  totalContribution: number;
};

export class BossActivityService {
  private readonly events = new Map<string, BossEvent>();
  private readonly rewards = new Map<string, BossReward>();
  private readonly premiumByAccountDay = new Map<string, number>();

  schedule(eventId: string, channelId: string, bossId: string, totalHp: number) {
    if (this.events.has(eventId)) throw new Error('boss_event_exists');
    if (!Number.isSafeInteger(totalHp) || totalHp <= 0) throw new Error('invalid_boss_hp');
    this.events.set(eventId, {
      eventId,
      channelId,
      bossId,
      totalHp,
      status: 'scheduled',
      contributions: new Map(),
    });
  }

  start(eventId: string) {
    const event = this.requireEvent(eventId);
    if (event.status === 'finished') throw new Error('boss_event_finished');
    event.status = 'active';
  }

  get(eventId: string): BossEventView {
    const event = this.requireEvent(eventId);
    return {
      eventId: event.eventId,
      channelId: event.channelId,
      bossId: event.bossId,
      totalHp: event.totalHp,
      status: event.status,
      totalContribution: [...event.contributions.values()].reduce((sum, entry) => sum + entry.damage, 0),
    };
  }

  recordContribution(eventId: string, accountId: string, damage: number, tick: number) {
    const event = this.requireEvent(eventId);
    if (event.status !== 'active') throw new Error('boss_event_inactive');
    if (!Number.isFinite(damage) || damage <= 0 || !Number.isSafeInteger(tick) || tick < 0)
      throw new Error('invalid_boss_contribution');
    const current = event.contributions.get(accountId) ?? { accountId, damage: 0, lastContributionTick: tick };
    current.damage += Math.floor(damage);
    current.lastContributionTick = tick;
    event.contributions.set(accountId, current);
  }

  finish(eventId: string, dayKey: string) {
    const event = this.requireEvent(eventId);
    if (event.status === 'finished') return [...this.rewards.values()].filter((reward) => reward.eventId === eventId).map(cloneReward);
    event.status = 'finished';
    const totalDamage = [...event.contributions.values()].reduce((sum, entry) => sum + entry.damage, 0);
    if (totalDamage <= 0) return [];
    return [...event.contributions.values()]
      .sort((left, right) => right.damage - left.damage || left.accountId.localeCompare(right.accountId))
      .map((entry) => {
        const identity = `${event.channelId}:${event.eventId}:${entry.accountId}`;
        const existing = this.rewards.get(identity);
        if (existing) return cloneReward(existing);
        const share = entry.damage / totalDamage;
        const tier: BossRewardTier = share >= 0.5 ? 'gold' : share >= 0.1 ? 'silver' : share >= 0.01 ? 'bronze' : 'participation';
        const premiumKey = `${dayKey}:${entry.accountId}`;
        const premium = (this.premiumByAccountDay.get(premiumKey) ?? 0) < 1 && tier !== 'participation';
        if (premium) this.premiumByAccountDay.set(premiumKey, (this.premiumByAccountDay.get(premiumKey) ?? 0) + 1);
        const reward: BossReward = { rewardIdentity: identity, eventId, accountId: entry.accountId, tier, premium, contributionShare: share };
        this.rewards.set(identity, reward);
        return cloneReward(reward);
      });
  }

  private requireEvent(eventId: string) {
    const event = this.events.get(eventId);
    if (!event) throw new Error('boss_event_not_found');
    return event;
  }
}

function cloneReward(reward: BossReward): BossReward {
  return { ...reward };
}
