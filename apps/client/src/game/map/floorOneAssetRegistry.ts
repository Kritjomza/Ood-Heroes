export type FloorOneAssetZone = 'all' | 'zone-1' | 'zone-2' | 'zone-3' | 'river' | 'camp' | 'arena' | 'portal';
export type FloorOneAssetCategory = 'ground' | 'transition' | 'river' | 'prop' | 'decal' | 'landmark';
export type FloorOneAsset = {
  id: string;
  path: string;
  width: number;
  height: number;
  category: FloorOneAssetCategory;
  zone: FloorOneAssetZone;
  transparency: boolean;
  required: boolean;
  placeholder: boolean;
  seamless: boolean;
  displayWidth: number;
  displayHeight: number;
  origin: readonly [number, number];
  rotate: boolean;
  mirror: boolean;
  collision: 'none' | 'visual-cue' | 'slow-terrain';
  layer: 'ground' | 'below-actors' | 'above-actors';
};

const ROOT = '/assets/game/floor-01';
const asset = (id: string, file: string, category: FloorOneAssetCategory, zone: FloorOneAssetZone, options: Partial<Omit<FloorOneAsset, 'id'|'path'|'category'|'zone'>> = {}): FloorOneAsset => ({
  id, path: `${ROOT}/${file}`, category, zone, width: 128, height: 128, transparency: category !== 'ground', required: true,
  placeholder: true, seamless: category === 'ground', displayWidth: 64, displayHeight: 64, origin: [0.5, 0.5], rotate: false, mirror: false,
  collision: 'none', layer: category === 'ground' || category === 'transition' || category === 'river' || category === 'decal' ? 'ground' : 'below-actors', ...options,
});

export const FLOOR_ONE_ASSETS: readonly FloorOneAsset[] = [
  asset('floor1.ground.honey', 'ground/zone-1-honey-meadow.webp', 'ground', 'zone-1'),
  asset('floor1.ground.mint', 'ground/zone-2-mint-marsh.webp', 'ground', 'zone-2'),
  asset('floor1.ground.cocoa', 'ground/zone-3-cocoa-woodland.webp', 'ground', 'zone-3'),
  asset('floor1.ground.camp', 'ground/central-camp-cloth.webp', 'ground', 'camp'),
  asset('floor1.ground.arena', 'ground/guardian-arena-plate.webp', 'ground', 'arena'),
  asset('floor1.transition.honey-mint', 'transitions/honey-to-mint.webp', 'transition', 'all', { displayWidth: 256, displayHeight: 256, rotate: true, mirror: true }),
  asset('floor1.transition.mint-cocoa', 'transitions/mint-to-cocoa.webp', 'transition', 'all', { displayWidth: 256, displayHeight: 256, rotate: true, mirror: true }),
  asset('floor1.transition.cocoa-honey', 'transitions/cocoa-to-honey.webp', 'transition', 'all', { displayWidth: 256, displayHeight: 256, rotate: true, mirror: true }),
  asset('floor1.river.straight', 'river/blueberry-straight.webp', 'river', 'river', { seamless: true, rotate: true }),
  asset('floor1.river.bend', 'river/blueberry-bend.webp', 'river', 'river', { rotate: true, mirror: true }),
  asset('floor1.river.bank', 'river/blueberry-bank.webp', 'river', 'river', { seamless: true, rotate: true, mirror: true }),
  asset('floor1.river.bridge', 'river/wafer-bridge.webp', 'river', 'river', { transparency: true, displayWidth: 128, rotate: true, collision: 'visual-cue', layer: 'above-actors' }),
  asset('floor1.river.foam', 'river/soda-foam.webp', 'decal', 'river', { transparency: true, rotate: true, mirror: true }),
  asset('floor1.prop.biscuit-rock', 'props/biscuit-rock.webp', 'prop', 'zone-1', { transparency: true, displayWidth: 54, displayHeight: 48, rotate: true, mirror: true, collision: 'visual-cue' }),
  asset('floor1.prop.warm-flowers', 'props/warm-flower-cluster.webp', 'prop', 'zone-1', { transparency: true, displayWidth: 44, displayHeight: 38, rotate: true, mirror: true }),
  asset('floor1.prop.friendly-sign', 'props/friendly-sign.webp', 'prop', 'zone-1', { transparency: true, displayWidth: 62, displayHeight: 76, origin: [0.5, 0.9], collision: 'visual-cue', layer: 'above-actors' }),
  asset('floor1.prop.mint-puddle', 'props/mint-puddle.webp', 'decal', 'zone-2', { transparency: true, displayWidth: 96, displayHeight: 52, rotate: true, mirror: true, collision: 'slow-terrain' }),
  asset('floor1.prop.jelly-reeds', 'props/jelly-reeds.webp', 'prop', 'zone-2', { transparency: true, displayWidth: 52, displayHeight: 68, origin: [0.5, 0.9], mirror: true, collision: 'visual-cue', layer: 'above-actors' }),
  asset('floor1.prop.stepping-stones', 'props/marsh-stepping-stones.webp', 'decal', 'zone-2', { transparency: true, displayWidth: 96, displayHeight: 48, rotate: true, mirror: true }),
  asset('floor1.prop.soda-bubbles', 'props/soda-bubbles.webp', 'prop', 'zone-2', { transparency: true, displayWidth: 40, displayHeight: 56, mirror: true }),
  asset('floor1.prop.candy-roots', 'props/candy-roots.webp', 'prop', 'zone-3', { transparency: true, displayWidth: 90, displayHeight: 58, rotate: true, mirror: true, collision: 'visual-cue' }),
  asset('floor1.prop.ember-peppers', 'props/ember-peppers.webp', 'prop', 'zone-3', { transparency: true, displayWidth: 46, displayHeight: 54, origin: [0.5, 0.9], mirror: true }),
  asset('floor1.prop.dark-shrub', 'props/dark-cocoa-shrub.webp', 'prop', 'zone-3', { transparency: true, displayWidth: 68, displayHeight: 60, origin: [0.5, 0.85], mirror: true, collision: 'visual-cue', layer: 'above-actors' }),
  asset('floor1.prop.purple-crystal', 'props/purple-crystal.webp', 'prop', 'zone-3', { transparency: true, displayWidth: 48, displayHeight: 62, origin: [0.5, 0.9], mirror: true, collision: 'visual-cue', layer: 'above-actors' }),
  asset('floor1.landmark.summon', 'landmarks/summon-shrine.webp', 'landmark', 'camp', { width: 256, height: 256, transparency: true, displayWidth: 118, displayHeight: 118, origin: [0.5, 0.9], layer: 'above-actors' }),
  asset('floor1.landmark.team', 'landmarks/team-station.webp', 'landmark', 'camp', { width: 256, height: 256, transparency: true, displayWidth: 118, displayHeight: 118, origin: [0.5, 0.9], layer: 'above-actors' }),
  asset('floor1.landmark.afk', 'landmarks/afk-chest.webp', 'landmark', 'camp', { width: 256, height: 256, transparency: true, displayWidth: 96, displayHeight: 96, origin: [0.5, 0.9], layer: 'above-actors' }),
  asset('floor1.landmark.portal', 'landmarks/floor-2-portal.webp', 'landmark', 'portal', { width: 384, height: 384, transparency: true, displayWidth: 224, displayHeight: 176, origin: [0.5, 0.88], layer: 'above-actors' }),
  asset('floor1.landmark.arena', 'landmarks/guardian-arena-gate.webp', 'landmark', 'arena', { width: 384, height: 256, transparency: true, displayWidth: 224, displayHeight: 144, origin: [0.5, 0.9], layer: 'above-actors' }),
] as const;

export const floorOneAsset = (id: string) => FLOOR_ONE_ASSETS.find((entry) => entry.id === id);

export function validateFloorOneAssets(assets: readonly FloorOneAsset[]): string[] {
  const errors: string[] = []; const ids = new Set<string>(); const paths = new Set<string>();
  for (const item of assets) {
    if (ids.has(item.id)) errors.push(`Duplicate Floor 1 asset id: ${item.id}`);
    if (paths.has(item.path)) errors.push(`Duplicate Floor 1 asset path: ${item.path}`);
    if (item.width <= 0 || item.height <= 0 || item.displayWidth <= 0 || item.displayHeight <= 0) errors.push(`Invalid dimensions: ${item.id}`);
    if (!item.path.endsWith('.webp')) errors.push(`Floor 1 asset must be WebP: ${item.id}`);
    ids.add(item.id); paths.add(item.path);
  }
  return errors;
}
