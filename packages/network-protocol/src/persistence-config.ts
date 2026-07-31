export const DATA_CONTRACT_VERSION = 1;
export const DATA_SCHEMA_VERSION = 1;

export const PERSISTENCE_CONFIG = {
  summonHistoryLimit: 20,
  maxSummonHistoryLimit: 50,
  mutationIdempotencyHeader: 'idempotency-key',
} as const;
