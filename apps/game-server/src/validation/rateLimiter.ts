import { NETWORK_CONFIG } from '@odd-tower/network-protocol';

type Bucket = { tokens: number; updatedAtMs: number; rejected: number };
export type RateLimitResult = 'accepted' | 'dropped' | 'disconnect';

export class ClientRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly config: { ratePerSecond: number; burst: number; disconnectThreshold: number };

  constructor(config?: { ratePerSecond: number; burst: number; disconnectThreshold: number }) {
    this.config =
      config ??
      ({
        ratePerSecond: NETWORK_CONFIG.ratePerSecond,
        burst: NETWORK_CONFIG.rateBurst,
        disconnectThreshold: NETWORK_CONFIG.abuseDisconnectThreshold,
      } as const);
  }

  get trackedClients() {
    return this.buckets.size;
  }

  consume(clientId: string, nowMs: number): RateLimitResult {
    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = { tokens: this.config.burst, updatedAtMs: nowMs, rejected: 0 };
      this.buckets.set(clientId, bucket);
    }
    const elapsed = Math.max(0, nowMs - bucket.updatedAtMs);
    bucket.tokens = Math.min(
      this.config.burst,
      bucket.tokens + (elapsed / 1000) * this.config.ratePerSecond,
    );
    bucket.updatedAtMs = nowMs;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.rejected = Math.max(0, bucket.rejected - 1);
      return 'accepted';
    }
    bucket.rejected += 1;
    return bucket.rejected >= this.config.disconnectThreshold ? 'disconnect' : 'dropped';
  }

  remove(clientId: string) {
    this.buckets.delete(clientId);
  }
}
