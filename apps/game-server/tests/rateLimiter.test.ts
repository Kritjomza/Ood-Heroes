// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ClientRateLimiter } from '../src/validation/rateLimiter';

describe('per-client rate limiting', () => {
  it('accepts normal 20 Hz traffic and a small ten-command burst', () => {
    const limiter = new ClientRateLimiter();
    for (let index = 0; index < 20; index++)
      expect(limiter.consume('a', index * 50)).toBe('accepted');
    limiter.remove('a');
    for (let index = 0; index < 10; index++) expect(limiter.consume('a', 2_000)).toBe('accepted');
  });

  it('drops excess traffic and escalates persistent abuse', () => {
    const limiter = new ClientRateLimiter();
    for (let index = 0; index < 10; index++) limiter.consume('a', 0);
    expect(limiter.consume('a', 0)).toBe('dropped');
    limiter.consume('a', 0);
    limiter.consume('a', 0);
    limiter.consume('a', 0);
    expect(limiter.consume('a', 0)).toBe('disconnect');
  });

  it('isolates one abusive client from another allowance', () => {
    const limiter = new ClientRateLimiter();
    for (let index = 0; index < 15; index++) limiter.consume('a', 0);
    expect(limiter.consume('b', 0)).toBe('accepted');
    expect(limiter.trackedClients).toBe(2);
    limiter.remove('a');
    expect(limiter.trackedClients).toBe(1);
  });
});
