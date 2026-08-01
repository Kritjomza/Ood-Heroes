// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc }),
}));

import { SupabasePersistenceService } from '../src/persistence/SupabasePersistenceService';

const service = new SupabasePersistenceService({
  url: 'https://project.example.test',
  publishableKey: 'publishable-test-value',
  secretKey: 'secret-test-value',
  issuer: 'https://project.example.test/auth/v1',
});

describe('SupabasePersistenceService bootstrap failures', () => {
  beforeEach(() => rpc.mockReset());

  it('classifies a missing player profile as not found instead of unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(service.bootstrap('10000000-0000-4000-8000-000000000001')).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      status: 404,
    });
  });

  it('classifies a database/RPC failure as persistence unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'connection unavailable' } });
    await expect(service.bootstrap('10000000-0000-4000-8000-000000000001')).rejects.toMatchObject({
      code: 'PERSISTENCE_UNAVAILABLE',
      status: 503,
    });
  });
});
