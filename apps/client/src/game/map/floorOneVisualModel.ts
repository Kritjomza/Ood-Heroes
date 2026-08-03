import type { FLOOR_ONE_MAP } from '@odd-tower/game-core';

export type FloorDetail = { tileX: number; tileY: number; kind: 'grass' | 'flower' | 'stone' | 'spark'; tint: number; scale: number };
export type FloorPath = { from: { x: number; y: number }; to: { x: number; y: number }; widthTiles: number };
export type FloorAssetPlacement = { assetId: string; tileX: number; tileY: number; rotation: number; flipX: boolean; depth: 'ground' | 'below-actors' | 'above-actors' };

const ZONE_STYLES = {
  portal: { base: 0x3f2957, edge: 0xb48ad5 },
  guardian_arena: { base: 0x61798d, edge: 0xa9c4d4 },
  chocolate_swamp: { base: 0x6d4438, edge: 0xc78d68 },
  spicy_forest: { base: 0x8a493d, edge: 0xd87952 },
  beginner_fields: { base: 0x5f8a52, edge: 0xa5cf72 },
  central_camp: { base: 0x4b8279, edge: 0x9fe1bf },
} as const;

function randomSource(seed: number) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createFloorOneVisualModel(map: typeof FLOOR_ONE_MAP, seed = 1931) {
  const blocked = new Set<string>();
  for (const rect of map.layers.find((layer) => layer.name === 'Collision')?.rects ?? [])
    for (let y = rect.y; y < rect.y + rect.height; y++)
      for (let x = rect.x; x < rect.x + rect.width; x++) blocked.add(`${x},${y}`);
  const reserved = new Set<string>();
  for (const object of map.objects.filter((item) => item.type !== 'zone' && item.type !== 'reset_boundary' && item.type !== 'combat_boundary')) {
    for (let y = object.y - 1; y < object.y + object.height + 1; y++)
      for (let x = object.x - 1; x < object.x + object.width + 1; x++) reserved.add(`${x},${y}`);
  }
  const random = randomSource(seed);
  const kinds: FloorDetail['kind'][] = ['grass', 'grass', 'grass', 'flower', 'stone', 'spark'];
  const details: FloorDetail[] = [];
  for (let attempt = 0; attempt < 320; attempt++) {
    const tileX = 2 + Math.floor(random() * (map.width - 4));
    const tileY = 2 + Math.floor(random() * (map.height - 4));
    if (blocked.has(`${tileX},${tileY}`) || reserved.has(`${tileX},${tileY}`) || details.some((item) => item.tileX === tileX && item.tileY === tileY)) continue;
    const kind = kinds[Math.floor(random() * kinds.length)]!;
    details.push({ tileX, tileY, kind, tint: kind === 'flower' ? 0xff9fbd : kind === 'stone' ? 0xa9b0a2 : kind === 'spark' ? 0xffdc72 : 0x76bd58, scale: 0.65 + random() * 0.55 });
  }
  const center = map.objects.find((item) => item.id === 'spawn.player.1') ?? { x: map.width / 2, y: map.height * 0.72, width: 0, height: 0 };
  const destinations = map.objects.filter((item) => item.type === 'camp_exit' || item.type === 'boss_spawn' || item.type === 'portal');
  const paths: FloorPath[] = destinations.map((item) => ({
    from: { x: center.x + center.width / 2, y: center.y + center.height / 2 },
    to: { x: item.x + item.width / 2, y: item.y + item.height / 2 },
    widthTiles: item.type === 'portal' ? 2.5 : 1.8,
  }));
  const zoneStyles = map.objects.filter((item) => item.type === 'zone').map((item) => ({
    id: item.zone,
    rect: { x: item.x, y: item.y, width: item.width, height: item.height },
    ...ZONE_STYLES[item.zone],
  }));
  const placements: FloorAssetPlacement[] = details.slice(0, 90).map((detail, index) => {
    const zone = zoneStyles.find((item) => detail.tileX >= item.rect.x && detail.tileX < item.rect.x + item.rect.width && detail.tileY >= item.rect.y && detail.tileY < item.rect.y + item.rect.height)?.id;
    const assetId = zone === 'chocolate_swamp'
      ? ['floor1.prop.mint-puddle', 'floor1.prop.jelly-reeds', 'floor1.prop.stepping-stones', 'floor1.prop.soda-bubbles'][index % 4]!
      : zone === 'spicy_forest'
        ? ['floor1.prop.candy-roots', 'floor1.prop.ember-peppers', 'floor1.prop.dark-shrub', 'floor1.prop.purple-crystal'][index % 4]!
        : ['floor1.prop.biscuit-rock', 'floor1.prop.warm-flowers'][index % 2]!;
    return { assetId, tileX: detail.tileX, tileY: detail.tileY, rotation: (index % 4) * Math.PI / 2, flipX: index % 3 === 0, depth: assetId.includes('shrub') || assetId.includes('reeds') || assetId.includes('crystal') ? 'above-actors' : 'below-actors' };
  });
  const river: FloorAssetPlacement[] = Array.from({ length: 12 }, (_, index) => ({
    assetId: index === 6 ? 'floor1.river.bridge' : index % 5 === 4 ? 'floor1.river.foam' : 'floor1.river.straight',
    tileX: 16 + index * 2,
    tileY: 34 + Math.round(Math.sin(index * 0.75) * 2),
    rotation: index === 6 ? 0 : Math.PI / 2,
    flipX: index % 2 === 0,
    depth: index === 6 ? 'above-actors' : 'ground',
  } as FloorAssetPlacement));
  const transitions: FloorAssetPlacement[] = [
    { assetId: 'floor1.transition.honey-mint', tileX: 23, tileY: 38, rotation: 0, flipX: false, depth: 'ground' },
    { assetId: 'floor1.transition.mint-cocoa', tileX: 39, tileY: 31, rotation: Math.PI / 2, flipX: false, depth: 'ground' },
    { assetId: 'floor1.transition.cocoa-honey', tileX: 40, tileY: 40, rotation: Math.PI / 2, flipX: true, depth: 'ground' },
    { assetId: 'floor1.prop.friendly-sign', tileX: 24.5, tileY: 46, rotation: 0, flipX: false, depth: 'above-actors' },
  ] as FloorAssetPlacement[];
  const landmarks: FloorAssetPlacement[] = [
    ['floor1.landmark.summon', 'landmark.summon_shrine'], ['floor1.landmark.team', 'landmark.team_station'], ['floor1.landmark.afk', 'landmark.afk_chest'],
    ['floor1.landmark.portal', 'portal.floor_2'], ['floor1.landmark.arena', 'arena.player_entry'],
  ].flatMap(([assetId, objectId]) => {
    const object = map.objects.find((item) => item.id === objectId);
    return object ? [{ assetId, tileX: object.x + object.width / 2, tileY: object.y + object.height / 2, rotation: 0, flipX: false, depth: 'above-actors' as const }] : [];
  });
  return {
    blocked,
    reserved,
    details,
    paths,
    zoneStyles,
    placements,
    river,
    transitions,
    landmarks,
    scale: { heroMaxTiles: 2.6, bossMaxTiles: 4.2, landmarkLabelPx: 13 },
    depths: { ground: -20, path: -17, detail: -15, objects: 3, foreground: 12 } as const,
  };
}
