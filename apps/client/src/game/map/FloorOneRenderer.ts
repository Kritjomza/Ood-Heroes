import Phaser from 'phaser';
import { FLOOR_ONE_MAP, WORLD, floorOneObject } from '@odd-tower/game-core';
import { createFloorOneVisualModel } from './floorOneVisualModel';
import { ensureFloorOneFallbackTextures } from './FloorOneAssetLoader';
import { floorOneAsset } from './floorOneAssetRegistry';

const ZONE_COLORS: Record<string, number> = {
  portal: 0x49305f,
  guardian_arena: 0x496375,
  chocolate_swamp: 0x4b302d,
  spicy_forest: 0x713a32,
  beginner_fields: 0x496b3f,
  central_camp: 0x315f60,
};

export class FloorOneRenderer {
  private portal: Phaser.GameObjects.Arc | null = null;
  private collisionDebug: Phaser.GameObjects.Container | null = null;
  private guardian: Phaser.GameObjects.Container | null = null;
  private guardianBody: Phaser.GameObjects.Rectangle | null = null;
  private guardianHp: Phaser.GameObjects.Rectangle | null = null;
  private adds: Phaser.GameObjects.Arc[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  create() {
    ensureFloorOneFallbackTextures(this.scene);
    const visual = createFloorOneVisualModel(FLOOR_ONE_MAP);
    this.scene.add.rectangle(WORLD.size / 2, WORLD.size / 2, WORLD.size, WORLD.size, 0x203a35).setDepth(-20);
    for (const object of FLOOR_ONE_MAP.objects.filter((item) => item.type === 'zone')) {
      const style = visual.zoneStyles.find((item) => item.id === object.zone);
      const groundId = object.zone === 'beginner_fields' ? 'floor1.ground.honey'
        : object.zone === 'chocolate_swamp' ? 'floor1.ground.mint'
          : object.zone === 'spicy_forest' ? 'floor1.ground.cocoa'
            : object.zone === 'central_camp' ? 'floor1.ground.camp'
              : 'floor1.ground.arena';
      this.scene.add
        .tileSprite(
          (object.x + object.width / 2) * WORLD.tileSize,
          (object.y + object.height / 2) * WORLD.tileSize,
          object.width * WORLD.tileSize,
          object.height * WORLD.tileSize,
          groundId,
        )
        .setTint(style?.base ?? ZONE_COLORS[object.zone] ?? 0xffffff)
        .setAlpha(object.zone === 'central_camp' ? 0.98 : 0.9)
        .setDepth(-18);
    }
    const routes = this.scene.add.graphics().setDepth(visual.depths.path);
    for (const path of visual.paths) {
      routes.lineStyle(path.widthTiles * WORLD.tileSize, 0x47332c, 0.22);
      routes.lineBetween(path.from.x * WORLD.tileSize, path.from.y * WORLD.tileSize, path.to.x * WORLD.tileSize, path.to.y * WORLD.tileSize);
      routes.lineStyle(Math.max(8, path.widthTiles * WORLD.tileSize - 10), 0xf1d38c, 0.32);
      routes.lineBetween(path.from.x * WORLD.tileSize, path.from.y * WORLD.tileSize, path.to.x * WORLD.tileSize, path.to.y * WORLD.tileSize);
    }
    visual.transitions.forEach((placement) => this.renderPlacement(placement));
    visual.river.forEach((placement) => this.renderPlacement(placement));
    visual.placements.forEach((placement) => this.renderPlacement(placement));
    visual.landmarks.forEach((placement) => this.renderPlacement(placement));
    for (const landmark of FLOOR_ONE_MAP.objects.filter((item) => item.type === 'landmark'))
      this.scene.add
        .text((landmark.x + 0.5) * 32, (landmark.y + 0.5) * 32, this.landmarkLabel(landmark.id), {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#fff7d7',
          backgroundColor: '#17252bcc',
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(2);
    const portal = floorOneObject('portal.floor_2')!;
    this.portal = this.scene.add
      .circle((portal.x + portal.width / 2) * 32, (portal.y + portal.height / 2) * 32, 58, 0x372147, 0.9)
      .setStrokeStyle(8, 0x8863a7, 0.85)
      .setDepth(1);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.scene.tweens.add({ targets: this.portal, alpha: { from: 0.78, to: 1 }, scale: { from: 0.96, to: 1.04 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.scene.add
      .text(this.portal.x, this.portal.y + 78, 'SEALED PORTAL', { fontSize: '16px', color: '#dac8e8' })
      .setOrigin(0.5)
      .setDepth(2)
      .setName('floor-one-portal-label');
    const boss = floorOneObject('boss.angry_refrigerator')!;
    this.guardian = this.scene.add.container((boss.x + 0.5) * 32, (boss.y + 0.5) * 32).setDepth(4);
    const shadow = this.scene.add.ellipse(0, 30, 92, 30, 0x101820, 0.3);
    this.guardianBody = this.scene.add.rectangle(0, 0, 78, 106, 0xf0dfbd).setStrokeStyle(6, 0x2b1a14);
    const face = this.scene.add.text(0, -8, '▰  ▰\n  ▂', { fontSize: '18px', color: '#3c8f98', align: 'center' }).setOrigin(0.5);
    const hpBack = this.scene.add.rectangle(0, -72, 122, 10, 0x321d24);
    this.guardianHp = this.scene.add.rectangle(-60, -72, 120, 7, 0x78c8e3).setOrigin(0, 0.5);
    this.guardian.add([shadow, this.guardianBody, face, hpBack, this.guardianHp]).setVisible(false);
    this.scene.add
      .text(WORLD.safeCenter.x, WORLD.safeCenter.y - 180, 'CENTRAL CAMP • SAFE ZONE', {
        fontSize: '20px',
        color: '#d6fff4',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  private renderPlacement(placement: { assetId: string; tileX: number; tileY: number; rotation: number; flipX: boolean; depth: 'ground' | 'below-actors' | 'above-actors' }) {
    const asset = floorOneAsset(placement.assetId);
    if (!asset || !this.scene.textures.exists(asset.id)) return;
    this.scene.add.image(placement.tileX * WORLD.tileSize, placement.tileY * WORLD.tileSize, asset.id)
      .setOrigin(asset.origin[0], asset.origin[1])
      .setDisplaySize(asset.displayWidth, asset.displayHeight)
      .setFlipX(asset.mirror && placement.flipX)
      .setRotation(asset.rotate ? placement.rotation : 0)
      .setDepth(placement.depth === 'ground' ? -16 : placement.depth === 'below-actors' ? 1 : 8);
  }

  private createPixelGroundDetails() {
    const visual = createFloorOneVisualModel(FLOOR_ONE_MAP);
    const grid = this.scene.add.graphics().setDepth(visual.depths.ground + 1).setAlpha(0.11);
    grid.lineStyle(1, 0xf5ffd7);
    for (let tile = 0; tile <= 64; tile += 2) {
      grid.lineBetween(tile * 32, 0, tile * 32, WORLD.size);
      grid.lineBetween(0, tile * 32, WORLD.size, tile * 32);
    }
    for (const detail of visual.details) {
      const x = detail.tileX * 32 + 16;
      const y = detail.tileY * 32 + 16;
      if (detail.kind === 'grass') {
        const grass = this.scene.add.graphics().setDepth(visual.depths.detail);
        grass.lineStyle(3, detail.tint, 0.62);
        grass.lineBetween(x - 5, y + 5, x - 2, y - 4);
        grass.lineBetween(x, y + 5, x + 1, y - 6);
        grass.lineBetween(x + 5, y + 5, x + 7, y - 3);
        grass.setScale(detail.scale);
      } else if (detail.kind === 'flower') {
        this.scene.add.circle(x, y, 4 * detail.scale, detail.tint, 0.9).setStrokeStyle(2, 0xfff6d7, 0.8).setDepth(visual.depths.detail);
      } else if (detail.kind === 'stone') {
        this.scene.add.ellipse(x, y, 12 * detail.scale, 7 * detail.scale, detail.tint, 0.46).setDepth(visual.depths.detail);
      } else {
        this.scene.add.star(x, y, 4, 2, 5, detail.tint, 0.45).setDepth(visual.depths.detail);
      }
    }
    const camp = floorOneObject('spawn.camp') ?? FLOOR_ONE_MAP.objects.find((item) => item.zone === 'central_camp');
    if (camp) {
      const cx = (camp.x + camp.width / 2) * 32;
      const cy = (camp.y + camp.height / 2) * 32;
      this.scene.add.ellipse(cx, cy + 32, 380, 180, 0xaeeac9, 0.08).setDepth(-14);
      for (let i = 0; i < 8; i++) this.scene.add.circle(cx + Math.cos(i) * 120, cy + Math.sin(i) * 62, 4, 0xffdc72, 0.55).setDepth(-13);
    }
  }

  private lighten(color: number) {
    const r = Math.min(255, ((color >> 16) & 255) + 35);
    const g = Math.min(255, ((color >> 8) & 255) + 35);
    const b = Math.min(255, (color & 255) + 35);
    return (r << 16) | (g << 8) | b;
  }

  setPortalUnlocked(unlocked: boolean) {
    this.portal?.setFillStyle(unlocked ? 0x6e52b5 : 0x372147, 0.92).setStrokeStyle(8, unlocked ? 0xc9b3ff : 0x8863a7, 0.9);
    const label = this.scene.children.getByName('floor-one-portal-label') as Phaser.GameObjects.Text | null;
    label?.setText(unlocked ? 'PORTAL READY • ENTER MANUALLY' : 'SEALED PORTAL');
  }

  setGuardian(state: { status: string; phase: string; currentHp: number; maxHp: number; activeAdds: number } | null) {
    if (!state || !this.guardian || !this.guardianBody || !this.guardianHp) return;
    this.guardian.setVisible(state.status === 'active' || state.status === 'defeated');
    this.guardian.setAlpha(state.status === 'defeated' ? 0.25 : 1);
    this.guardianBody.setFillStyle(state.phase === 'enraged' ? 0xe56c67 : 0xf0dfbd);
    this.guardianHp.width = 120 * Math.max(0, Math.min(1, state.currentHp / Math.max(1, state.maxHp)));
    while (this.adds.length < state.activeAdds) {
      const index = this.adds.length;
      this.adds.push(
        this.scene.add
          .circle(this.guardian.x + (index === 0 ? -120 : 120), this.guardian.y + 55, 20, index === 0 ? 0x78c8e3 : 0x3c8f98)
          .setStrokeStyle(4, 0x2b1a14)
          .setDepth(4),
      );
    }
    this.adds.forEach((add, index) => add.setVisible(index < state.activeAdds && state.status === 'active'));
  }

  setCollisionDebug(visible: boolean) {
    if (!this.collisionDebug) {
      this.collisionDebug = this.scene.add.container(0, 0).setDepth(99);
      const rects = FLOOR_ONE_MAP.layers.find((layer) => layer.name === 'Collision')?.rects ?? [];
      for (const rect of rects)
        this.collisionDebug.add(
          this.scene.add
            .rectangle((rect.x + rect.width / 2) * 32, (rect.y + rect.height / 2) * 32, rect.width * 32, rect.height * 32, 0xff315f, 0.18)
            .setStrokeStyle(1, 0xff7b9c, 0.65),
        );
    }
    this.collisionDebug.setVisible(visible);
  }

  private landmarkLabel(id: string) {
    if (id.includes('summon')) return '✦ SUMMON SHRINE';
    if (id.includes('team')) return '⚑ TEAM STATION';
    return '▣ AFK REWARD';
  }
}
