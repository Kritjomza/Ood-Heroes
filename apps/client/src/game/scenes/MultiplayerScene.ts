import Phaser from 'phaser';
import {
  WORLD,
  formationDestination,
  prototypeMap,
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

export type OnlineControls = { mobile: Direction | null };
type TeamView = {
  leader: Phaser.GameObjects.Arc;
  tank: Phaser.GameObjects.Arc;
  support: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  position: Vector2;
  direction: Direction;
  heroBars: Array<{
    back: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    slow: Phaser.GameObjects.Arc;
  }>;
};
type MonsterView = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  hpBack: Phaser.GameObjects.Rectangle;
  hp: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  target: Phaser.GameObjects.Arc;
  warning: Phaser.GameObjects.Rectangle;
  lastHp: number;
  lastStatus: string;
};

export class MultiplayerScene extends Phaser.Scene {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private localTeam: TeamView | null = null;
  private readonly remoteTeams = new Map<string, TeamView>();
  private readonly monsterViews = new Map<string, MonsterView>();
  private lastDiagnosticAt = 0;
  private removeCombatListener: (() => void) | null = null;
  private readonly effectPool: Phaser.GameObjects.Arc[] = [];

  constructor(
    private readonly client: MultiplayerClient,
    private readonly controls: OnlineControls,
  ) {
    super({ key: 'multiplayer' });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD.size, WORLD.size);
    this.drawMap();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.cameras.main.setBounds(0, 0, WORLD.size, WORLD.size).setZoom(1.05);
    this.scale.on('resize', this.onResize, this);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.removeCombatListener = this.client.onCombatEvent((event) => this.playCombatEvent(event));
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
      this.updateTeamCombat(this.localTeam, this.client.localPlayerId);
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
      team.tank.setAlpha(sample.connected ? 1 : 0.45);
      team.support.setAlpha(sample.connected ? 1 : 0.45);
      this.positionTeam(team);
      this.updateTeamCombat(team, id);
    }
    for (const [id, team] of this.remoteTeams)
      if (!active.has(id)) {
        this.destroyTeam(team);
        this.remoteTeams.delete(id);
      }
    this.updateMonsters();
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
        root.dataset.heroHpBars = String((this.localTeam ? 3 : 0) + this.remoteTeams.size * 3);
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

  private updateMonsters() {
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
      .setSize(48, 56)
      .setInteractive();
    const target = this.add.circle(0, 7, 27).setStrokeStyle(3, 0xffe46b).setVisible(false);
    const warning = this.add
      .rectangle(0, 0, 26, 150, 0xff6b6b, 0.28)
      .setStrokeStyle(2, 0xffd75e, 0.9)
      .setVisible(false);
    const body = this.add
      .circle(
        0,
        0,
        monster.definitionId === 'wild-sausage' ? 22 : 18,
        colors[monster.definitionId] ?? 0xffffff,
      )
      .setStrokeStyle(3, 0x20252b);
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
    container.add([warning, target, body, hpBack, hp, label]);
    container.on('pointerdown', () => this.client.setFocusTarget(monster.id));
    return {
      container,
      body,
      hpBack,
      hp,
      label,
      target,
      warning,
      lastHp: monster.currentHp,
      lastStatus: monster.status,
    };
  }

  private drawMap() {
    this.add.rectangle(WORLD.size / 2, WORLD.size / 2, WORLD.size, WORLD.size, 0x172d34);
    this.add
      .circle(WORLD.safeCenter.x, WORLD.safeCenter.y, WORLD.safeRadius, 0x315f60, 0.9)
      .setStrokeStyle(6, 0x8de1cf);
    this.add
      .text(WORLD.safeCenter.x, WORLD.safeCenter.y - 120, 'ONLINE SAFE ZONE', {
        fontSize: '22px',
        color: '#d6fff4',
      })
      .setOrigin(0.5);
    for (const cell of prototypeMap.blocked) {
      const [x, y] = cell.split(',').map(Number);
      if (x === 0 || y === 0 || x === 63 || y === 63) continue;
      this.add
        .rectangle(x! * WORLD.tileSize + 16, y! * WORLD.tileSize + 16, 32, 32, 0x26343d)
        .setStrokeStyle(1, 0x52616b);
    }
  }

  private createTeam(player: NetworkPlayerState, local: boolean): TeamView {
    const color = local ? 0xffa64d : this.playerColor(player.id);
    const heroBars = Array.from({ length: 3 }, () => ({
      back: this.add.rectangle(player.x, player.y, 31, 6, 0x62463b).setDepth(4),
      fill: this.add.rectangle(player.x, player.y, 29, 4, 0x6bcf8e).setDepth(5),
      slow: this.add.circle(player.x, player.y, 23).setStrokeStyle(3, 0x9fb4c8).setVisible(false),
    }));
    return {
      leader: this.add.circle(player.x, player.y, 21, color).setStrokeStyle(4, 0xffffff, 0.9),
      tank: this.add
        .circle(player.x, player.y, 19, local ? 0x68a7ff : color)
        .setStrokeStyle(3, 0xbfd8ff),
      support: this.add
        .circle(player.x, player.y, 18, local ? 0xffef6e : color)
        .setStrokeStyle(3, 0xfff4bd),
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
      heroBars,
    };
  }

  private positionTeam(team: TeamView) {
    const leader = formationDestination(team.position, team.direction, 'fighter');
    const tank = formationDestination(team.position, team.direction, 'tank');
    const support = formationDestination(team.position, team.direction, 'support');
    team.leader.setPosition(leader.x, leader.y);
    team.tank.setPosition(tank.x, tank.y);
    team.support.setPosition(support.x, support.y);
    team.label.setPosition(leader.x, leader.y - 38);
    [leader, tank, support].forEach((position, index) => {
      const bar = team.heroBars[index]!;
      bar.back.setPosition(position.x, position.y - 28);
      bar.fill.setPosition(position.x, position.y - 28);
      bar.slow.setPosition(position.x, position.y);
    });
  }

  private updateTeamCombat(team: TeamView, playerId: string) {
    const combat = this.client.currentCombatPlayer(playerId);
    if (!combat) return;
    [...combat.heroes].forEach((hero, index) => {
      const bar = team.heroBars[index];
      if (!bar) return;
      const ratio = Math.max(0, Math.min(1, hero.currentHp / Math.max(1, hero.maxHp)));
      bar.fill.width = 29 * ratio;
      bar.fill.x = bar.back.x - 14.5 + bar.fill.width / 2;
      bar.fill.setFillStyle(hero.status === 'defeated' ? 0x8f8580 : 0x6bcf8e);
      bar.slow.setVisible(
        [...hero.statusEffects].some((effect) => effect.type === 'movement-slow'),
      );
    });
  }

  private playCombatEvent(event: CombatEvent) {
    const target = event.targetId ? this.worldPosition(event.targetId) : null;
    const source = event.sourceId ? this.worldPosition(event.sourceId) : null;
    const position = target ?? source;
    if (!position) return;
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
    const role = id.split(':').at(-1);
    const playerId = id.slice(0, Math.max(0, id.lastIndexOf(':')));
    const team =
      playerId === this.client.localPlayerId ? this.localTeam : this.remoteTeams.get(playerId);
    if (!team) return null;
    const object = role === 'tank' ? team.tank : role === 'support' ? team.support : team.leader;
    return { x: object.x, y: object.y };
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
    team.leader.destroy();
    team.tank.destroy();
    team.support.destroy();
    team.label.destroy();
    for (const bar of team.heroBars) {
      bar.back.destroy();
      bar.fill.destroy();
      bar.slow.destroy();
    }
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
