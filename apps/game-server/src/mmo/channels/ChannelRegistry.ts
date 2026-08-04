export type ChannelStatus = 'healthy' | 'draining';

export type ChannelRecord = {
  channelId: string;
  zoneId: string;
  region: string;
  population: number;
  capacity: number;
  status: ChannelStatus;
  createdAtMs: number;
};

type ChannelRegistryOptions = {
  capacity: number;
  createId: () => string;
  nowMs: () => number;
};

export class ChannelRegistry {
  private readonly records = new Map<string, ChannelRecord>();

  constructor(private readonly options: ChannelRegistryOptions) {
    if (!Number.isInteger(options.capacity) || options.capacity < 1)
      throw new Error('invalid_channel_capacity');
  }

  assign(zoneId: string, region: string, partySize: number): ChannelRecord {
    this.requirePartySize(partySize);
    const candidate = [...this.records.values()]
      .filter(
        (record) =>
          record.zoneId === zoneId &&
          record.region === region &&
          record.status === 'healthy' &&
          record.population + partySize <= record.capacity,
      )
      .sort(
        (left, right) =>
          Math.abs(left.population - 20) - Math.abs(right.population - 20) ||
          left.createdAtMs - right.createdAtMs ||
          left.channelId.localeCompare(right.channelId),
      )[0];
    if (candidate) return this.reserve(candidate.channelId, partySize);

    const record: ChannelRecord = {
      channelId: this.options.createId(),
      zoneId,
      region,
      population: partySize,
      capacity: this.options.capacity,
      status: 'healthy',
      createdAtMs: this.options.nowMs(),
    };
    if (this.records.has(record.channelId)) throw new Error('duplicate_channel_id');
    this.records.set(record.channelId, record);
    return { ...record };
  }

  reserve(channelId: string, count: number): ChannelRecord {
    this.requirePartySize(count);
    const record = this.records.get(channelId);
    if (!record || record.status !== 'healthy') throw new Error('channel_unavailable');
    if (record.population + count > record.capacity) throw new Error('channel_capacity');
    record.population += count;
    return { ...record };
  }

  release(channelId: string, count: number): void {
    if (!Number.isInteger(count) || count < 0) throw new Error('invalid_release_count');
    const record = this.records.get(channelId);
    if (record) record.population = Math.max(0, record.population - count);
  }

  get(channelId: string): ChannelRecord | undefined {
    const record = this.records.get(channelId);
    return record ? { ...record } : undefined;
  }

  private requirePartySize(partySize: number) {
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > this.options.capacity)
      throw new Error('party_capacity');
  }
}
