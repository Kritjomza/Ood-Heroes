import { readFile } from 'node:fs/promises';
import { PHASE_4_ASSETS } from '../apps/client/src/assets/manifests/phase-4-assets.js';

const json = JSON.parse(
  await readFile(new URL('../docs/assets/phase-4-asset-manifest.json', import.meta.url), 'utf8'),
) as {
  schemaVersion?: number;
  assets?: Array<Record<string, unknown>>;
};
const requiredFields = [
  'assetId',
  'category',
  'entityName',
  'usage',
  'priority',
  'currentState',
  'mockImplementation',
  'targetFilePath',
  'fileFormat',
  'width',
  'height',
  'transparentBackground',
  'cameraAngle',
  'requiredDirections',
  'frameCount',
  'anchorX',
  'anchorY',
  'atlasGroup',
  'mobileReadabilityNotes',
  'styleNotes',
  'promptSubjectNotes',
  'negativeRequirements',
  'replacementInstructions',
] as const;
const ids = PHASE_4_ASSETS.map((asset) => asset.id);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate runtime Asset IDs.');
if (
  PHASE_4_ASSETS.filter((asset) => asset.kind === 'hero' && asset.id.endsWith('.portrait'))
    .length !== 6
)
  throw new Error('The registry must contain exactly six Hero portraits.');
if (PHASE_4_ASSETS.length !== 75)
  throw new Error(`Expected 75 registry entries, received ${PHASE_4_ASSETS.length}.`);
const obsoleteHeroIds = ids.filter((id) => id.includes('.sprite_'));
if (obsoleteHeroIds.length)
  throw new Error(`Obsolete Hero animation IDs remain: ${obsoleteHeroIds.join(', ')}`);
if (json.schemaVersion !== 1) throw new Error('Unsupported Asset Manifest schema version.');
if (!json.assets || json.assets.length !== PHASE_4_ASSETS.length)
  throw new Error('JSON manifest and runtime registry counts differ.');
const manifestIds = json.assets.map((entry) => entry.assetId);
if (new Set(manifestIds).size !== manifestIds.length)
  throw new Error('Duplicate manifest Asset IDs.');
for (const asset of PHASE_4_ASSETS) {
  const documented = json.assets.find((entry) => entry.assetId === asset.id);
  if (!documented || documented.targetFilePath !== asset.replacementPath)
    throw new Error(`Manifest mismatch: ${asset.id}`);
  for (const field of requiredFields) {
    if (!(field in documented)) throw new Error(`Manifest field missing: ${asset.id}.${field}`);
  }
}
const heroFrames = json.assets
  .filter(
    (entry) =>
      String(entry.assetId).startsWith('hero.') && String(entry.assetId).endsWith('.world'),
  )
  .reduce((sum, entry) => sum + Number(entry.frameCount), 0);
if (heroFrames !== 6)
  throw new Error(`Expected 6 single-image Hero world visuals, received ${heroFrames}.`);
const heroSprites = json.assets.filter((entry) => String(entry.assetId).endsWith('.world'));
for (const hero of heroSprites)
  if (
    hero.width !== 96 ||
    hero.height !== 96 ||
    hero.frameCount !== 1 ||
    JSON.stringify(hero.requiredDirections) !== JSON.stringify(['right']) ||
    hero.anchorX !== 0.5 ||
    hero.anchorY !== 0.82
  ) throw new Error(`Invalid single-image Hero contract: ${hero.assetId}`);
const monsters = json.assets.filter((entry) => String(entry.assetId).startsWith('monster.'));
for (const monster of monsters)
  if (
    monster.width !== 96 ||
    monster.height !== 96 ||
    monster.frameCount !== 1 ||
    JSON.stringify(monster.requiredDirections) !== JSON.stringify(['right']) ||
    monster.anchorX !== 0.5 ||
    monster.anchorY !== 0.82 ||
    monster.atlasGroup !== null
  ) throw new Error(`Invalid static Monster contract: ${monster.assetId}`);
const priorities = Object.fromEntries(
  ['P0', 'P1', 'P2'].map((priority) => [
    priority,
    json.assets!.filter((entry) => entry.priority === priority).length,
  ]),
);
if (priorities.P0 !== 39 || priorities.P1 !== 17 || priorities.P2 !== 19)
  throw new Error(`Expected priorities 39/17/19, received ${priorities.P0}/${priorities.P1}/${priorities.P2}.`);
console.log(
  `Validated ${PHASE_4_ASSETS.length} Phase 4 Asset IDs, priorities 39/17/19, and gameplay/VFX sources 6/5/40/51.`,
);
