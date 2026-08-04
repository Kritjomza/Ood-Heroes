export type PendingReward = {
  rewardIdentity: string;
  accountId: string;
  payload: Readonly<Record<string, unknown>>;
  status: 'pending' | 'committed';
  createdAtMs: number;
  committedAtMs: number | null;
};

export class RewardLedger {
  private readonly entries = new Map<string, PendingReward>();

  prepare(input: Omit<PendingReward, 'status' | 'committedAtMs'>) {
    const existing = this.entries.get(input.rewardIdentity);
    if (existing) return clone(existing);
    const entry: PendingReward = {
      ...input,
      payload: { ...input.payload },
      status: 'pending',
      committedAtMs: null,
    };
    this.entries.set(entry.rewardIdentity, entry);
    return clone(entry);
  }

  commit(rewardIdentity: string, committedAtMs: number) {
    const entry = this.entries.get(rewardIdentity);
    if (!entry) throw new Error('reward_not_prepared');
    if (entry.status === 'committed') return clone(entry);
    entry.status = 'committed';
    entry.committedAtMs = committedAtMs;
    return clone(entry);
  }

  get(rewardIdentity: string) {
    const entry = this.entries.get(rewardIdentity);
    return entry ? clone(entry) : undefined;
  }

  committed(rewardIdentity: string) {
    return this.entries.get(rewardIdentity)?.status === 'committed';
  }

  pendingCount() {
    return [...this.entries.values()].filter((entry) => entry.status === 'pending').length;
  }
}

function clone(entry: PendingReward): PendingReward {
  return { ...entry, payload: { ...entry.payload } };
}
