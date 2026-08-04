export type MmoFeatureFlags = {
  worldEnabled: boolean;
  allowAll: boolean;
  eligibleAccountIds: ReadonlySet<string>;
};

export function readMmoFeatureFlags(
  environment: Record<string, string | undefined> = process.env,
): MmoFeatureFlags {
  const eligibleAccountIds = new Set(
    (environment.MMO_WORLD_ACCOUNT_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && value.length <= 64)
      .sort(),
  );
  const worldEnabled = environment.MMO_WORLD_ENABLED === '1';
  return {
    worldEnabled,
    // Open-world rollout is the default when enabled. Set MMO_WORLD_ALLOW_ALL=0
    // only when an operator intentionally wants to fall back to a cohort.
    allowAll: worldEnabled && environment.MMO_WORLD_ALLOW_ALL !== '0',
    eligibleAccountIds,
  };
}

export function isMmoEligible(accountId: string, flags: MmoFeatureFlags): boolean {
  return flags.worldEnabled && (flags.allowAll || flags.eligibleAccountIds.has(accountId));
}
