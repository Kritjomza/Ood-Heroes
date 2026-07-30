import Phaser from 'phaser';
import {
  WORLD,
  formationDestination,
  prototypeMap,
  type Direction,
  type Vector2,
} from '@odd-tower/game-core';
import type { CardinalDirection, NetworkPlayerState } from '@odd-tower/network-protocol';
import type { MultiplayerClient } from '../multiplayer/MultiplayerClient';

export type OnlineControls = { mobile: Direction | null };
type TeamView = {
  leader: Phaser.GameObjects.Arc;
  tank: Phaser.GameObjects.Arc;
  support: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  position: Vector2;
  direction: Direction;
};

export class MultiplayerScene extends Phaser.Scene {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private localTeam: TeamView | null = null;
  private readonly remoteTeams = new Map<string, TeamView>();
  private lastDiagnosticAt = 0;

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
    }
    for (const [id, team] of this.remoteTeams)
      if (!active.has(id)) {
        this.destroyTeam(team);
        this.remoteTeams.delete(id);
      }
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
      }
      this.lastDiagnosticAt = time;
    }
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
    this.controls.mobile = null;
    for (const team of this.remoteTeams.values()) this.destroyTeam(team);
    this.remoteTeams.clear();
    if (this.localTeam) this.destroyTeam(this.localTeam);
    this.localTeam = null;
  };
}
