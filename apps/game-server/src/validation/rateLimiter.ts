import { NETWORK_CONFIG } from '@odd-tower/network-protocol';

type Bucket = { tokens: number; updatedAtMs: number; rejected: number };
export type RateLimitResult = 'accepted' | 'dropped' | 'disconnect';

export class ClientRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  get trackedClients() {
    return this.buckets.size;
  }

  consume(clientId: string, nowMs: number): RateLimitResult {
    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = { tokens: NETWORK_CONFIG.rateBurst, updatedAtMs: nowMs, rejected: 0 };
      this.buckets.set(clientId, bucket);
    }
    const elapsed = Math.max(0, nowMs - bucket.updatedAtMs);
    bucket.tokens = Math.min(
      NETWORK_CONFIG.rateBurst,
      bucket.tokens + (elapsed / 1000) * NETWORK_CONFIG.ratePerSecond,
    );
    bucket.updatedAtMs = nowMs;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.rejected = Math.max(0, bucket.rejected - 1);
      return 'accepted';
    }
    bucket.rejected += 1;
    return bucket.rejected >= NETWORK_CONFIG.abuseDisconnectThreshold ? 'disconnect' : 'dropped';
  }

  remove(clientId: string) {
    this.buckets.delete(clientId);
  }
}
