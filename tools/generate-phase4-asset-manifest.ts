import { mkdir, writeFile } from 'node:fs/promises';
import { PHASE_4_ASSETS } from '../apps/client/src/assets/manifests/phase-4-assets.js';

type Priority = 'P0' | 'P1' | 'P2';

const entries = PHASE_4_ASSETS.map((asset) => {
  const sprite = asset.id.endsWith('.world');
  const portrait = asset.id.endsWith('.portrait');
  const icon = asset.id.endsWith('.icon');
  const collectionCard = asset.id.endsWith('.collection_card');
  const silhouette = asset.id.endsWith('.silhouette');
  const monster = asset.kind === 'monster';
  const vfx = asset.kind === 'vfx';
  const entityName = asset.id.startsWith('hero.')
    ? asset.label.replace(
        / (portrait|icon|collection card|world image|silhouette)$/u,
        '',
      )
    : monster
      ? asset.label
      : null;
  const frameCount = sprite || monster ? 1 : vfx ? 8 : 1;
  const directions = sprite
    ? ['right']
    : monster
      ? ['right']
      : [];
  const size = dimensions(asset.id, { portrait, icon, collectionCard, silhouette, sprite, monster, vfx });
  return {
    assetId: asset.id,
    category: asset.kind,
    entityName,
    usage: usage(asset.id),
    priority: priority(asset.id, asset.kind),
    currentState: 'mock',
    mockImplementation:
      asset.mock === 'css-hero'
        ? 'CSS shape and project-authored glyph'
        : 'Project-authored glyph/CSS primitive',
    targetFilePath: asset.replacementPath,
    fileFormat: 'webp',
    width: size[0],
    height: size[1],
    transparentBackground: !asset.id.includes('background') && !asset.id.includes('.tiles'),
    cameraAngle: sprite || monster ? 'orthographic three-quarter top-down' : null,
    requiredDirections: directions,
    frameCount,
    anchorX: sprite || monster || vfx ? 0.5 : null,
    anchorY: sprite || monster ? 0.82 : vfx ? 0.5 : null,
    atlasGroup: vfx
          ? 'vfx.floor_1'
          : null,
    mobileReadabilityNotes: 'Preserve a clear silhouette and readable contrast at 48 CSS pixels.',
    styleNotes: 'Cute pastel sticker style, chocolate outline, original Odd Tower design language.',
    promptSubjectNotes: entityName
      ? `Original ${entityName} design; preserve the approved gameplay silhouette.`
      : 'Match the named UI function without adding text baked into the image.',
    negativeRequirements: [
      'no copyrighted characters',
      'no photorealism',
      'no baked UI text',
      'no unsafe edge crop',
    ],
    replacementInstructions: `Export to ${asset.replacementPath}; retain this Asset ID and registry entry.`,
  };
});

await mkdir('docs/assets', { recursive: true });
await writeFile(
  'docs/assets/phase-4-asset-manifest.json',
  `${JSON.stringify({ schemaVersion: 1, assets: entries }, null, 2)}\n`,
);
const csvHeaders = Object.keys(entries[0]!);
const csv = [
  csvHeaders.join(','),
  ...entries.map((entry) =>
    csvHeaders
      .map((header) => quoteCsv(JSON.stringify(entry[header as keyof typeof entry])))
      .join(','),
  ),
].join('\n');
await writeFile('docs/assets/phase-4-asset-manifest.csv', `${csv}\n`);
console.log(`Generated ${entries.length} complete Asset Manifest entries.`);

function dimensions(
  id: string,
  flags: {
    portrait: boolean;
    icon: boolean;
    collectionCard: boolean;
    silhouette: boolean;
    sprite: boolean;
    monster: boolean;
    vfx: boolean;
  },
): [number, number] {
  if (flags.portrait || flags.silhouette) return [512, 512];
  if (flags.icon) return [128, 128];
  if (flags.collectionCard) return [640, 800];
  if (flags.sprite) return [96, 96];
  if (flags.monster) return [96, 96];
  if (flags.vfx) return [512, 512];
  if (id.includes('background')) return [1920, 1080];
  if (id.includes('.tiles')) return [1024, 1024];
  return [256, 256];
}

function usage(id: string) {
  if (id.startsWith('hero.')) return ['Collection', 'Hero Detail', 'Team Builder', 'Combat'];
  if (id.startsWith('ui.summon')) return ['Summon'];
  if (id.startsWith('ui.team')) return ['Team Builder'];
  if (id.startsWith('ui.afk')) return ['AFK Reward'];
  if (id.startsWith('ui.auth')) return ['Auth'];
  if (id.startsWith('ui.home')) return ['Home'];
  if (id.startsWith('item.')) return ['Home', 'HUD', 'Rewards'];
  if (id.startsWith('monster.')) return ['Floor 1 Combat'];
  if (id.startsWith('map.')) return ['Floor 1 Combat'];
  if (id.startsWith('vfx.')) return ['Floor 1 Combat'];
  return ['Persistent UI'];
}

function priority(id: string, kind: string): Priority {
  if (
    id.endsWith('.portrait') ||
    id.endsWith('.icon') ||
    id.endsWith('.collection_card') ||
    id.startsWith('item.') ||
    id.startsWith('ui.auth') ||
    id.startsWith('ui.home') ||
    id.startsWith('ui.summon') ||
    id.startsWith('ui.team') ||
    id.startsWith('ui.afk')
  )
    return 'P0';
  if (id.endsWith('.world') || kind === 'monster' || kind === 'map' || kind === 'vfx')
    return 'P1';
  return 'P2';
}

function quoteCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
