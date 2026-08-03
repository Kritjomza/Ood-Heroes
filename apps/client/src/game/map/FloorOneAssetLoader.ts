import Phaser from 'phaser';
import { FLOOR_ONE_ASSETS, type FloorOneAsset } from './floorOneAssetRegistry';

export function preloadFloorOneAssets(scene: Phaser.Scene) {
  for (const asset of FLOOR_ONE_ASSETS) {
    if (!scene.textures.exists(asset.id)) scene.load.image(asset.id, asset.path);
  }
}

export function ensureFloorOneFallbackTextures(scene: Phaser.Scene) {
  for (const asset of FLOOR_ONE_ASSETS) {
    if (scene.textures.exists(asset.id)) continue;
    createFallbackTexture(scene, asset);
  }
}

function createFallbackTexture(scene: Phaser.Scene, asset: FloorOneAsset) {
  const size = 128;
  const colors: Record<string, [number, number]> = {
    'zone-1': [0xd9b856, 0xf7dc83], 'zone-2': [0x72bfa2, 0xa6e2c8], 'zone-3': [0x684638, 0xa66a4f],
    river: [0x537dca, 0xa8dcf4], camp: [0xe6c77c, 0xffe9a8], arena: [0x80909f, 0xb9c7d0], portal: [0x7851a5, 0xc79bea], all: [0xc69d69, 0xf2d29b],
  };
  const [base, accent] = colors[asset.zone] ?? colors.all!;
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.fillStyle(asset.transparency ? base : base, asset.transparency ? 0.96 : 1).fillRoundedRect(3, 3, size - 6, size - 6, asset.category === 'ground' ? 10 : 28);
  graphics.lineStyle(6, accent, 0.9).strokeRoundedRect(4, 4, size - 8, size - 8, asset.category === 'ground' ? 10 : 28);
  if (asset.category === 'ground') {
    graphics.lineStyle(3, accent, 0.38);
    for (let i = 16; i < size; i += 32) { graphics.lineBetween(i, 0, i, size); graphics.lineBetween(0, i, size, i); }
  } else if (asset.category === 'river') {
    graphics.lineStyle(9, accent, 0.75);
    graphics.lineBetween(0, 68, 38, 54).lineBetween(38, 54, 84, 76).lineBetween(84, 76, 128, 58);
  } else {
    graphics.fillStyle(accent, 0.72).fillCircle(64, 58, 26).fillCircle(43, 75, 16).fillCircle(85, 78, 18);
  }
  graphics.generateTexture(asset.id, size, size);
  graphics.destroy();
}
