import Phaser from 'phaser';
import {
  WORLD,
  formationDestination,
  type Direction,
  type Vector2,
} from '@odd-tower/game-core';
import type {
  CardinalDirection,
  CombatEvent,
  NetworkMonsterState,
  NetworkPlayerState,
} from '@odd-tower/network-protocol';
import type { MultiplayerClient } from '../multiplayer/MultiplayerClient';
import { FloorOneRenderer } from '../map/FloorOneRenderer';
import { preloadFloorOneAssets } from '../map/FloorOneAssetLoader';
import { composeWorldScale, WORLD_SPRITE_HEIGHT, worldScaleForHeight } from '../rendering/spriteWorldScale';
import { WORLD_VISUALS } from '../../assets/world-visuals';
import {
  createMotionState,
  updateSingleSpriteMotion,
  type SingleSpriteMotionState,
} from '../animation/SingleSpriteMotionController';
import {
  HERO_WORLD_ASSET_IDS,
  MONSTER_ASSET_IDS,
  type HorizontalFacing,
  heroTextureKey,
  monsterTextureKey,
} from './heroDirectionalSprites';

export type OnlineControls = { mobile: Direction | null };
type TeamView = {
  leader: Phaser.GameObjects.Container;
  heroes: HeroView[];
  label: Phaser.GameObjects.Text;
  position: Vector2;
  direction: Direction;
  lastMotionPosition: Vector2;
  lastMotionAt: number;
};
type HeroView = {
  id: string;
  definitionId: string;
  role: 'fighter' | 'tank' | 'support';
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Ellipse;
  hpBack: Phaser.GameObjects.Rectangle;
  hp: Phaser.GameObjects.Rectangle;
  slow: Phaser.GameObjects.Arc;
  lastStatus: string;
  visual: SingleSpriteMotionState;
  baseScale: number;
};
type MonsterView = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Ellipse;
  hpBack: Phaser.GameObjects.Rectangle;
  hp: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  target: Phaser.GameObjects.Arc;
  warning: Phaser.GameObjects.Rectangle;
  lastHp: number;
  lastStatus: string;
  facing: HorizontalFacing;
  visual: SingleSpriteMotionState;
  lastMotionPosition: Vector2;
  lastMotionAt: number;
  baseScale: number;
};

export class MultiplayerScene extends Phaser.Scene {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private localTeam: TeamView | null = null;
  private readonly remoteTeams = new Map<string, TeamView>();
  private readonly monsterViews = new Map<string, MonsterView>();
  private lastDiagnosticAt = 0;
  private removeCombatListener: (() => void) | null = null;
  private removeCompletionListener: (() => void) | null = null;
  private readonly effectPool: Phaser.GameObjects.Arc[] = [];
  private floorRenderer!: FloorOneRenderer;

  constructor(
    private readonly client: MultiplayerClient,
    private readonly controls: OnlineControls,
  ) {
    super({ key: 'multiplayer' });
  }

  preload() {
    preloadFloorOneAssets(this);
    const usedKeys = new Set<string>([
      ...Object.values(HERO_WORLD_ASSET_IDS),
      ...Object.values(MONSTER_ASSET_IDS),
    ]);
    for (const visual of WORLD_VISUALS)
      if (usedKeys.has(visual.textureKey)) this.load.image(visual.textureKey, visual.sourcePath);
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD.size, WORLD.size);
    this.drawMap();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.cameras.main.setBounds(0, 0, WORLD.size, WORLD.size).setZoom(1.05);
    this.scale.on('resize', this.onResize, this);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.removeCombatListener = this.client.onCombatEvent((event) => this.playCombatEvent(event));
    this.removeCompletionListener = this.client.onFloorCompletion((result) => {
      const completed = result.status === 'completed';
      this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY, completed ? 'FLOOR 1 COMPLETE\n+500 Gold  +100 Gem' : String(result.status), {
          fontSize: '24px',
          align: 'center',
          color: completed ? '#fff3b0' : '#ffffff',
          backgroundColor: '#101820ee',
          padding: { x: 20, y: 14 },
        })
        .setScrollFactor(0)
        .setOrigin(0.5)
        .setDepth(200);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  update(time: number) {
    const direction = this.manualDirection();
    this.client.setDirection(direction);
    const predicted = this.client.getLocalPosition();
    const localState = this.client.currentPlayer(this.client.localPlayerId);
    if (predicted && localState) {
      if (!this.localTeam) {
        this.localTeam = this.createTeam(localState, true);
        this.cameras.main.startFollow(this.localTeam.leader, true, 0.12, 0.12);
      }
      if (this.client.consumeHardCorrection()) this.localTeam.position = { ...predicted };
      else {
        this.localTeam.position.x = Phaser.Math.Linear(
          this.localTeam.position.x,
          predicted.x,
          0.45,
        );
        this.localTeam.position.y = Phaser.Math.Linear(
          this.localTeam.position.y,
          predicted.y,
          0.45,
        );
      }
      this.localTeam.direction = this.renderDirection(
        localState.direction,
        this.localTeam.direction,
      );
      this.positionTeam(this.localTeam);
      this.applyMovementMotion(this.localTeam, localState.moving, time);
      this.updateTeamCombat(this.localTeam, this.client.localPlayerId);
      this.floorRenderer.setPortalUnlocked(
        Boolean(this.client.currentCombatPlayer(this.client.localPlayerId)?.bossDefeated),
      );
      this.floorRenderer.setGuardian(this.client.currentGuardian());
      if (Phaser.Input.Keyboard.JustDown(this.keys.E) && Math.hypot(predicted.x - 1040, predicted.y - 112) < 120)
        this.client.completeFloorOne();
    }

    const active = new Set(this.client.remotePlayerIds());
    for (const id of active) {
      const sample = this.client.sampleRemote(id, performance.now());
      if (!sample) continue;
      let team = this.remoteTeams.get(id);
      if (!team) {
        team = this.createTeam(sample, false);
        this.remoteTeams.set(id, team);
      }
      team.position = { x: sample.x, y: sample.y };
      team.direction = this.renderDirection(sample.direction, team.direction);
      team.label.setAlpha(sample.connected ? 1 : 0.55);
      team.leader.setAlpha(sample.connected ? 1 : 0.45);
      for (const hero of team.heroes) hero.container.setAlpha(sample.connected ? 1 : 0.45);
      this.positionTeam(team);
      this.applyMovementMotion(team, sample.moving, time);
      this.updateTeamCombat(team, id);
    }
    for (const [id, team] of this.remoteTeams)
      if (!active.has(id)) {
        this.destroyTeam(team);
        this.remoteTeams.delete(id);
      }
    this.updateMonsters(time);
    if (time - this.lastDiagnosticAt >= 200) {
      const root = this.game.canvas.parentElement;
      if (root) {
        root.dataset.remoteTeams = String(this.remoteTeams.size);
        root.dataset.localPosition = predicted
          ? `${Math.round(predicted.x)},${Math.round(predicted.y)}`
          : '';
        root.dataset.remotePositions = JSON.stringify(
          [...this.remoteTeams.entries()].map(([id, team]) => [
            id,
            Math.round(team.position.x),
            Math.round(team.position.y),
          ]),
        );
        root.dataset.monsterCount = String(this.monsterViews.size);
        root.dataset.monsterIds = [...this.monsterViews.keys()].join(',');
        root.dataset.monsterHp = JSON.stringify(
          this.client
            .monsterIds()
            .map((id) => [id, this.client.currentMonster(id)?.currentHp ?? 0]),
        );
        root.dataset.monsterPositions = JSON.stringify(
          [...this.monsterViews.entries()].map(([id, view]) => [
            id,
            Math.round(view.container.x),
            Math.round(view.container.y),
          ]),
        );
        root.dataset.heroHpBars = String(
          (this.localTeam?.heroes.length ?? 0) +
            [...this.remoteTeams.values()].reduce((sum, team) => sum + team.heroes.length, 0),
        );
        root.dataset.chargeWarnings = String(
          [...this.monsterViews.values()].filter((view) => view.warning.visible).length,
        );
        root.dataset.activeEffects = String(
          this.effectPool.filter((effect) => effect.visible).length,
        );
        const monsterScreenPositions = [...this.monsterViews.entries()].map(([id, view]) => ({
          id,
          ...this.worldToScreen(view.container),
        }));
        root.dataset.monsterScreenPositions = JSON.stringify(monsterScreenPositions);
        const visibleMonster = monsterScreenPositions
          .filter(
            (point) =>
              point.x > 40 &&
              point.y > 70 &&
              point.x < this.cameras.main.width - 40 &&
              point.y < this.cameras.main.height - 90,
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - this.cameras.main.width / 2, a.y - this.cameras.main.height / 2) -
              Math.hypot(b.x - this.cameras.main.width / 2, b.y - this.cameras.main.height / 2),
          )[0];
        root.dataset.firstMonsterScreen = visibleMonster ? JSON.stringify(visibleMonster) : '';
      }
      this.lastDiagnosticAt = time;
    }
  }

  private updateMonsters(time: number) {
    const active = new Set(this.client.monsterIds());
    const focused = this.client.focusedMonsterId();
    const autoTarget = this.client.autoHuntTargetId();
    for (const id of active) {
      const monster = this.client.currentMonster(id);
      if (!monster) continue;
      let view = this.monsterViews.get(id);
      if (!view) {
        view = this.createMonster(monster);
        this.monsterViews.set(id, view);
      }
      view.container.x = Phaser.Math.Linear(view.container.x, monster.x, 0.35);
      view.container.y = Phaser.Math.Linear(view.container.y, monster.y, 0.35);
      const elapsed = Math.max(1, time - view.lastMotionAt);
      view.visual = updateSingleSpriteMotion(view.visual, {
        velocityX: ((view.container.x - view.lastMotionPosition.x) / elapsed) * 1000,
        velocityY: ((view.container.y - view.lastMotionPosition.y) / elapsed) * 1000,
        nowMs: time,
      });
      view.facing = view.visual.facing;
      view.lastMotionPosition = { x: view.container.x, y: view.container.y };
      view.lastMotionAt = time;
      if (!this.tweens.isTweening(view.body)) {
        view.body.y = (view.body instanceof Phaser.GameObjects.Image ? 20 : 0) + view.visual.visualY;
        const scale = composeWorldScale(view.baseScale, view.visual.scaleX, view.visual.scaleY);
        view.body.setScale(scale.x, scale.y).setAngle(view.visual.angle);
        if (view.body instanceof Phaser.GameObjects.Image) view.body.setFlipX(view.visual.flipX);
        view.shadow.setScale(view.visual.shadowScale).setAlpha(view.visual.shadowAlpha);
      }
      const ratio = Math.max(0, Math.min(1, monster.currentHp / Math.max(1, monster.maxHp)));
      view.hp.width = 38 * ratio;
      view.hp.x = -19 + view.hp.width / 2;
      view.target
        .setVisible(focused === id || autoTarget === id)
        .setStrokeStyle(3, focused === id ? 0xffd75e : 0x8ee0ba);
      const charging = monster.aiState === 'windup';
      view.warning.setVisible(charging);
      if (charging) {
        const horizontal = monster.direction === 'left' || monster.direction === 'right';
        view.warning.setSize(horizontal ? 150 : 26, horizontal ? 26 : 150);
        view.warning.setPosition(
          monster.direction === 'left' ? -75 : monster.direction === 'right' ? 75 : 0,
          monster.direction === 'up' ? -75 : monster.direction === 'down' ? 75 : 0,
        );
      }
      view.container.setVisible(monster.status === 'alive');
      view.label.setText(`${monster.name} Lv.${monster.level}`);
      if (monster.currentHp < view.lastHp) {
        view.body.setAlpha(0.35);
        this.time.delayedCall(70, () => view?.body.active && view.body.setAlpha(1));
      }
      if (view.lastStatus === 'alive' && monster.status !== 'alive')
        this.spawnEffect(view.container.x, view.container.y, 0xffb58a, 1.8);
      if (view.lastStatus !== 'alive' && monster.status === 'alive')
        this.spawnEffect(monster.x, monster.y, 0x8ee0ba, 1.6);
      view.lastHp = monster.currentHp;
      view.lastStatus = monster.status;
    }
    for (const [id, view] of this.monsterViews)
      if (!active.has(id)) {
        view.container.destroy(true);
        this.monsterViews.delete(id);
      }
  }

  private worldToScreen(point: Vector2) {
    const camera = this.cameras.main;
    const origin = camera.getWorldPoint(0, 0);
    const unitX = camera.getWorldPoint(1, 0);
    const unitY = camera.getWorldPoint(0, 1);
    const a = unitX.x - origin.x;
    const b = unitY.x - origin.x;
    const c = unitX.y - origin.y;
    const d = unitY.y - origin.y;
    const determinant = a * d - b * c;
    if (Math.abs(determinant) < Number.EPSILON) return { x: -1, y: -1 };
    const worldX = point.x - origin.x;
    const worldY = point.y - origin.y;
    return {
      x: (worldX * d - b * worldY) / determinant,
      y: (a * worldY - worldX * c) / determinant,
    };
  }

  private createMonster(monster: NetworkMonsterState): MonsterView {
    const colors: Record<string, number> = {
      'grumpy-radish': 0x79d14d,
      'jumping-sauce-bag': 0xf08d49,
      'shoe-biting-dust-ball': 0x9b8f89,
      'wild-sausage': 0xc85252,
      'lost-pudding': 0xd993e8,
    };
    const container = this.add
      .container(monster.x, monster.y)
      .setDepth(2)
      .setSize(34, 24)
      .setInteractive(new Phaser.Geom.Rectangle(-17, 2, 34, 24), Phaser.Geom.Rectangle.Contains);
    const target = this.add.circle(0, 7, 27).setStrokeStyle(3, 0xffe46b).setVisible(false);
    const shadow = this.add.ellipse(0, 18, 38, 14, 0x101820, 0.28);
    const warning = this.add
      .rectangle(0, 0, 26, 150, 0xff6b6b, 0.28)
      .setStrokeStyle(2, 0xffd75e, 0.9)
      .setVisible(false);
    const textureKey = monsterTextureKey(monster.definitionId);
    const body = textureKey && this.textures.exists(textureKey)
      ? this.add.image(0, 20, textureKey).setOrigin(0.5, 0.82)
      : this.add
          .circle(
            0,
            0,
            monster.definitionId === 'wild-sausage' ? 22 : 18,
            colors[monster.definitionId] ?? 0xffffff,
          )
          .setStrokeStyle(3, 0x20252b);
    const baseScale = body instanceof Phaser.GameObjects.Image
      ? worldScaleForHeight(body.height, WORLD_SPRITE_HEIGHT.monster)
      : 1;
    body.setScale(baseScale);
    const hpBack = this.add.rectangle(0, -30, 40, 6, 0x321d24);
    const hp = this.add.rectangle(0, -30, 38, 4, 0x67e76e);
    const label = this.add
      .text(0, -44, `${monster.name} Lv.${monster.level}`, {
        fontSize: '11px',
        color: '#fff',
        backgroundColor: '#101820bb',
        padding: { x: 3, y: 1 },
      })
      .setOrigin(0.5);
    container.add([warning, target, shadow, body, hpBack, hp, label]);
    container.on('pointerdown', () => this.client.setFocusTarget(monster.id));
    return {
      container,
      body,
      shadow,
      hpBack,
      hp,
      label,
      target,
      warning,
      lastHp: monster.currentHp,
      lastStatus: monster.status,
      facing: monster.direction === 'right' ? 'right' : 'left',
      visual: createMotionState(
        monster.definitionId === 'wild-sausage' ? 'heavy' : monster.definitionId === 'lost-pudding' ? 'jelly' : 'normal',
        monster.direction === 'left' ? 'left' : 'right',
        (monster.id.length % 11) / 11,
      ),
      lastMotionPosition: { x: monster.x, y: monster.y },
      lastMotionAt: 0,
      baseScale,
    };
  }

  private drawMap() {
    this.floorRenderer = new FloorOneRenderer(this);
    this.floorRenderer.create();
  }

  private createTeam(player: NetworkPlayerState, local: boolean): TeamView {
    const color = local ? 0xffa64d : this.playerColor(player.id);
    const heroes = (['fighter', 'tank', 'support'] as const).map((role, index) =>
      this.createHeroView(`${player.id}:fallback:${index}`, '', role, player.x, player.y, color),
    );
    return {
      leader: heroes[0]!.container,
      heroes,
      label: this.add
        .text(player.x, player.y - 38, player.displayName, {
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#101820bb',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5),
      position: { x: player.x, y: player.y },
      direction: this.renderDirection(player.direction, 'down'),
      lastMotionPosition: { x: player.x, y: player.y },
      lastMotionAt: 0,
    };
  }

  private positionTeam(team: TeamView) {
    for (const hero of team.heroes) {
      const position = formationDestination(team.position, team.direction, hero.role);
      hero.container.setPosition(position.x, position.y);
    }
    const leader = team.heroes[0]?.container ?? team.leader;
    team.leader = leader;
    team.label.setPosition(leader.x, leader.y - 52);
  }

  private updateTeamCombat(team: TeamView, playerId: string) {
    const combat = this.client.currentCombatPlayer(playerId);
    if (!combat) return;
    [...combat.heroes].forEach((hero, index) => {
      let view = team.heroes[index];
      if (!view || view.id !== hero.id || view.definitionId !== hero.definitionId) {
        view?.container.destroy(true);
        view = this.createHeroView(
          hero.id,
          typeof hero.definitionId === 'string' ? hero.definitionId : '',
          hero.role,
          team.position.x,
          team.position.y,
          this.playerColor(playerId),
        );
        team.heroes[index] = view;
      }
      view.role = hero.role;
      const ratio = Math.max(0, Math.min(1, hero.currentHp / Math.max(1, hero.maxHp)));
      view.hp.width = 29 * ratio;
      view.hp.x = -14.5 + view.hp.width / 2;
      view.hp.setFillStyle(hero.status === 'defeated' ? 0x8f8580 : 0x6bcf8e);
      view.slow.setVisible(
        [...hero.statusEffects].some((effect) => effect.type === 'movement-slow'),
      );
      if (view.lastStatus !== hero.status) this.playHeroStatusTween(view, hero.status);
      view.lastStatus = hero.status;
    });
    while (team.heroes.length > combat.heroes.length) team.heroes.pop()!.container.destroy(true);
    team.leader = team.heroes[0]?.container ?? team.leader;
  }

  private applyMovementMotion(team: TeamView, moving: boolean, time: number) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const elapsed = Math.max(1, time - team.lastMotionAt);
    const velocityX = moving ? ((team.position.x - team.lastMotionPosition.x) / elapsed) * 1000 : 0;
    const velocityY = moving ? ((team.position.y - team.lastMotionPosition.y) / elapsed) * 1000 : 0;
    team.lastMotionPosition = { ...team.position };
    team.lastMotionAt = time;
    for (const hero of team.heroes) {
      hero.visual = updateSingleSpriteMotion(hero.visual, { velocityX, velocityY, nowMs: time });
      if (this.tweens.isTweening(hero.body)) continue;
      hero.body.y = (hero.body instanceof Phaser.GameObjects.Image ? 20 : 0) + (reduced ? 0 : hero.visual.visualY);
      hero.body.setAngle(reduced ? 0 : hero.visual.angle);
      const scale = reduced
        ? { x: hero.baseScale, y: hero.baseScale }
        : composeWorldScale(hero.baseScale, hero.visual.scaleX, hero.visual.scaleY);
      hero.body.setScale(scale.x, scale.y);
      if (hero.body instanceof Phaser.GameObjects.Image) hero.body.setFlipX(hero.visual.flipX);
      hero.shadow.setScale(hero.visual.shadowScale).setAlpha(hero.visual.shadowAlpha);
    }
  }

  private createHeroView(
    id: string,
    definitionId: string,
    role: 'fighter' | 'tank' | 'support',
    x: number,
    y: number,
    fallbackColor: number,
  ): HeroView {
    const container = this.add.container(x, y).setDepth(3);
    const shadow = this.add.ellipse(0, 18, 40, 14, 0x101820, 0.28);
    const textureKey = heroTextureKey(definitionId);
    const body = textureKey && this.textures.exists(textureKey)
      ? this.add.image(0, 20, textureKey).setOrigin(0.5, 0.82)
      : this.add.circle(0, 0, 20, fallbackColor).setStrokeStyle(4, 0x2b1a14);
    const targetHeight = WORLD_SPRITE_HEIGHT.hero[role];
    const baseScale = body instanceof Phaser.GameObjects.Image ? worldScaleForHeight(body.height, targetHeight) : 1;
    body.setScale(baseScale);
    const hpBack = this.add.rectangle(0, -30, 31, 6, 0x62463b);
    const hp = this.add.rectangle(0, -30, 29, 4, 0x6bcf8e);
    const slow = this.add.circle(0, 0, 25).setStrokeStyle(3, 0x9fb4c8).setVisible(false);
    container.add([slow, shadow, body, hpBack, hp]);
    return {
      id,
      definitionId,
      role,
      container,
      body,
      shadow,
      hpBack,
      hp,
      slow,
      lastStatus: 'alive',
      visual: createMotionState(
        role === 'tank' ? 'jelly' : role === 'support' ? 'floating' : 'normal',
        'right',
        (id.length % 13) / 13,
      ),
      baseScale,
    };
  }

  private playHeroStatusTween(view: HeroView, status: string) {
    this.tweens.killTweensOf(view.container);
    view.container.setAlpha(1).setAngle(0).setScale(1);
    if (status === 'defeated') {
      this.tweens.add({
        targets: view.container,
        scaleX: 1.25,
        scaleY: 0.35,
        angle: 18,
        alpha: 0.35,
        duration: 220,
        ease: 'Quad.easeOut',
      });
    } else {
      this.tweens.add({
        targets: view.container,
        scaleX: { from: 0.8, to: 1 },
        scaleY: { from: 1.2, to: 1 },
        alpha: 1,
        duration: 180,
        ease: 'Back.easeOut',
      });
    }
  }

  private playCombatEvent(event: CombatEvent) {
    const target = event.targetId ? this.worldPosition(event.targetId) : null;
    const source = event.sourceId ? this.worldPosition(event.sourceId) : null;
    const position = target ?? source;
    if (!position) return;
    const heroView = event.targetId ? this.findHeroView(event.targetId) : null;
    const sourceHero = event.sourceId ? this.findHeroView(event.sourceId) : null;
    if (event.type === 'hero-attack' && sourceHero) this.playHeroAttackTween(sourceHero);
    if ((event.type === 'damage' || event.type === 'hero-defeated') && heroView)
      this.playHeroHitTween(heroView);
    const color =
      event.type === 'monster-heal'
        ? 0x8ee0ba
        : event.type === 'slow-applied'
          ? 0x9fb4c8
          : event.type === 'charge-warning' || event.type === 'charge-impact'
            ? 0xffb58a
            : 0xfff8e8;
    this.spawnEffect(position.x, position.y, color, event.type === 'charge-impact' ? 2 : 1.25);
  }

  private worldPosition(id: string): Vector2 | null {
    const monster = this.monsterViews.get(id);
    if (monster) return { x: monster.container.x, y: monster.container.y };
    const hero = this.findHeroView(id);
    return hero ? { x: hero.container.x, y: hero.container.y } : null;
  }

  private findHeroView(id: string) {
    const teams = [this.localTeam, ...this.remoteTeams.values()];
    for (const team of teams) {
      const hero = team?.heroes.find((candidate) => candidate.id === id);
      if (hero) return hero;
    }
    return null;
  }

  private playHeroAttackTween(view: HeroView) {
    this.tweens.killTweensOf(view.body);
    const axis = view.role === 'support' ? 'y' : 'x';
    this.tweens.add({
      targets: view.body,
      [axis]: { from: 0, to: axis === 'x' ? 8 : -8 },
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => view.body.setPosition(0, view.body instanceof Phaser.GameObjects.Sprite ? 20 : 0),
    });
  }

  private playHeroHitTween(view: HeroView) {
    this.tweens.killTweensOf(view.body);
    if (view.body instanceof Phaser.GameObjects.Sprite) view.body.setTint(0xffffff);
    this.tweens.add({
      targets: view.body,
      x: { from: -3, to: 3 },
      alpha: { from: 0.45, to: 1 },
      duration: 45,
      repeat: 2,
      yoyo: true,
      onComplete: () => {
        if (view.body instanceof Phaser.GameObjects.Sprite) view.body.clearTint();
        view.body.setPosition(0, view.body instanceof Phaser.GameObjects.Sprite ? 20 : 0);
      },
    });
  }

  private spawnEffect(x: number, y: number, color: number, scale: number) {
    let effect = this.effectPool.find((candidate) => !candidate.visible);
    if (!effect && this.effectPool.length < 32) {
      effect = this.add.circle(0, 0, 12).setDepth(8).setVisible(false);
      this.effectPool.push(effect);
    }
    if (!effect) return;
    effect
      .setPosition(x, y)
      .setRadius(12)
      .setFillStyle(color, 0.25)
      .setStrokeStyle(3, color)
      .setScale(0.5)
      .setAlpha(1)
      .setVisible(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.tweens.add({
      targets: effect,
      scale: reduced ? 1 : scale,
      alpha: 0,
      duration: reduced ? 80 : 260,
      onComplete: () => effect?.setVisible(false),
    });
  }

  private manualDirection(): CardinalDirection {
    if (this.controls.mobile) return this.controls.mobile;
    const left = this.keys.A.isDown || this.keys.LEFT.isDown;
    const right = this.keys.D.isDown || this.keys.RIGHT.isDown;
    const up = this.keys.W.isDown || this.keys.UP.isDown;
    const down = this.keys.S.isDown || this.keys.DOWN.isDown;
    if (left !== right) return left ? 'left' : 'right';
    if (up !== down) return up ? 'up' : 'down';
    return 'none';
  }

  private renderDirection(direction: CardinalDirection, fallback: Direction): Direction {
    return direction === 'none' ? fallback : direction;
  }

  private playerColor(id: string) {
    let hash = 0;
    for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return Phaser.Display.Color.HSVToRGB((hash % 360) / 360, 0.55, 0.95).color;
  }

  private destroyTeam(team: TeamView) {
    for (const hero of team.heroes) hero.container.destroy(true);
    team.label.destroy();
  }

  private onResize = (size: Phaser.Structs.Size) =>
    this.cameras.main.setViewport(0, 0, size.width, size.height);
  private onVisibility = () => {
    if (document.hidden) {
      this.controls.mobile = null;
      this.client.setDirection('none');
    }
  };
  private cleanup = () => {
    this.scale.off('resize', this.onResize, this);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.client.setDirection('none');
    this.removeCombatListener?.();
    this.removeCombatListener = null;
    this.removeCompletionListener?.();
    this.removeCompletionListener = null;
    this.controls.mobile = null;
    for (const team of this.remoteTeams.values()) this.destroyTeam(team);
    this.remoteTeams.clear();
    if (this.localTeam) this.destroyTeam(this.localTeam);
    this.localTeam = null;
    for (const view of this.monsterViews.values()) view.container.destroy(true);
    this.monsterViews.clear();
    for (const effect of this.effectPool) effect.destroy();
    this.effectPool.length = 0;
  };
}
