export type MmoFeatureFlags = {
  worldEnabled: boolean;
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
  return {
    worldEnabled: environment.MMO_WORLD_ENABLED === '1',
    eligibleAccountIds,
  };
}

export function isMmoEligible(accountId: string, flags: MmoFeatureFlags): boolean {
  return flags.worldEnabled && flags.eligibleAccountIds.has(accountId);
}
