import type { FLOOR_ONE_MAP } from '@odd-tower/game-core';

export type FloorDetail = { tileX: number; tileY: number; kind: 'grass' | 'flower' | 'stone' | 'spark'; tint: number; scale: number };

function randomSource(seed: number) {
  let value = seed >>> 0;
  return () => ((value = (value * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createFloorOneVisualModel(map: typeof FLOOR_ONE_MAP, seed = 1931) {
  const blocked = new Set<string>();
  for (const rect of map.layers.find((layer) => layer.name === 'Collision')?.rects ?? [])
    for (let y = rect.y; y < rect.y + rect.height; y++)
      for (let x = rect.x; x < rect.x + rect.width; x++) blocked.add(`${x},${y}`);
  const random = randomSource(seed);
  const kinds: FloorDetail['kind'][] = ['grass', 'grass', 'grass', 'flower', 'stone', 'spark'];
  const details: FloorDetail[] = [];
  for (let attempt = 0; attempt < 320; attempt++) {
    const tileX = 2 + Math.floor(random() * (map.width - 4));
    const tileY = 2 + Math.floor(random() * (map.height - 4));
    if (blocked.has(`${tileX},${tileY}`) || details.some((item) => item.tileX === tileX && item.tileY === tileY)) continue;
    const kind = kinds[Math.floor(random() * kinds.length)]!;
    details.push({ tileX, tileY, kind, tint: kind === 'flower' ? 0xff9fbd : kind === 'stone' ? 0xa9b0a2 : kind === 'spark' ? 0xffdc72 : 0x76bd58, scale: 0.65 + random() * 0.55 });
  }
  return { blocked, details, depths: { ground: -20, detail: -15, objects: 3, foreground: 12 } as const };
}
