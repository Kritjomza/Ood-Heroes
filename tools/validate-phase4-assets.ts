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
if (PHASE_4_ASSETS.length !== 123)
  throw new Error(`Expected 123 registry entries, received ${PHASE_4_ASSETS.length}.`);
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
      String(entry.assetId).startsWith('hero.') && String(entry.assetId).includes('.sprite_'),
  )
  .reduce((sum, entry) => sum + Number(entry.frameCount), 0);
if (heroFrames !== 432)
  throw new Error(`Expected 432 Hero animation frames, received ${heroFrames}.`);
console.log(
  `Validated ${PHASE_4_ASSETS.length} Phase 4 Asset IDs, 6 Hero portraits, and ${heroFrames} Hero animation frames.`,
);
