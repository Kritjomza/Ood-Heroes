import Phaser from 'phaser';
import {
  HERO_CONFIG,
  MONSTER,
  MONSTER_SPAWNS,
  WORLD,
  applyExperience,
  calculateDamage,
  findPath,
  formationDestination,
  isInSafeZone,
  prototypeMap,
  requiredExperienceForNextLevel,
  tileToWorld,
  worldToTile,
  type AutoHuntState,
  type Direction,
  type HeroRole,
  type Vector2,
} from '@odd-tower/game-core';
import type { GameBridge } from '../bridge';
import type { Controls } from '../createGame';
import { FloorOneRenderer } from '../map/FloorOneRenderer';
import {
  createMotionState,
  updateSingleSpriteMotion,
  type SingleSpriteMotionState,
} from '../animation/SingleSpriteMotionController';
type HeroView = {
  role: HeroRole;
  shape: Phaser.GameObjects.Container;
  visual: Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Ellipse;
  motion: SingleSpriteMotionState;
  lastPosition: Vector2;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  experience: number;
  lastAttack: number;
  status: 'alive' | 'defeated';
};
type Mob = {
  id: string;
  shape: Phaser.GameObjects.Container;
  body: Phaser.Physics.Arcade.Body;
  visual: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  motion: SingleSpriteMotionState;
  lastPosition: Vector2;
  hp: number;
  maxHp: number;
  level: number;
  spawn: Vector2;
  lastAttack: number;
  defeatedAt: number;
  rewarded: boolean;
  status: 'alive' | 'defeated';
};
export class GameScene extends Phaser.Scene {
  private bridge: GameBridge;
  private controls: Controls;
  private anchor!: Phaser.Physics.Arcade.Image;
  private heroes: HeroView[] = [];
  private mobs: Mob[] = [];
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing: Direction = 'down';
  private autoEnabled = false;
  private autoState: AutoHuntState = 'disabled';
  private path: Vector2[] = [];
  private target: Mob | null = null;
  private paused = false;
  private wipeAt = 0;
  private lastHud = 0;
  private lastPathAt = 0;
  private fxPool: Phaser.GameObjects.Arc[] = [];
  private floorRenderer!: FloorOneRenderer;
  constructor(bridge: GameBridge, controls: Controls) {
    super({ key: 'game' });
    this.bridge = bridge;
    this.controls = controls;
  }
  create() {
    this.physics.world.setBounds(0, 0, WORLD.size, WORLD.size);
    this.drawMap();
    this.makeTextures();
    this.anchor = this.physics.add
      .image(WORLD.safeCenter.x, WORLD.safeCenter.y, 'anchor')
      .setVisible(false)
      .setCollideWorldBounds(true);
    this.anchor.body!.setSize(30, 30);
    this.physics.add.collider(this.anchor, this.obstacles);
    this.createHeroes();
    this.createMonsters();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.keys.SPACE.on('down', this.toggleAuto, this);
    this.keys.ESC.on('down', this.togglePause, this);
    this.input.on(
      'gameobjectdown',
      (_p: Phaser.Input.Pointer, o: Phaser.GameObjects.GameObject) => {
        const mob = this.mobs.find((m) => m.shape === o);
        if (mob?.status === 'alive') {
          this.target = mob;
          this.autoState = this.autoEnabled ? 'navigating' : 'disabled';
        }
      },
    );
    this.cameras.main
      .setBounds(0, 0, WORLD.size, WORLD.size)
      .startFollow(this.anchor, true, 0.09, 0.09)
      .setZoom(1.05);
    this.scale.on('resize', this.onResize, this);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.publish(0);
  }
  private drawMap() {
    this.floorRenderer = new FloorOneRenderer(this);
    this.floorRenderer.create();
    this.obstacles = this.physics.add.staticGroup();
    for (const cell of prototypeMap.blocked) {
      const [x, y] = cell.split(',').map(Number);
      if (x === 0 || y === 0 || x === 63 || y === 63) continue;
      const block = this.add
        .rectangle(x! * 32 + 16, y! * 32 + 16, 32, 32, 0x26343d)
        .setStrokeStyle(1, 0x52616b);
      this.physics.add.existing(block, true);
      this.obstacles.add(block);
    }
  }
  private makeTextures() {
    const make = (key: string, color: number, size: number) => {
      const g = this.add
        .graphics()
        .fillStyle(color)
        .fillCircle(size / 2, size / 2, size / 2)
        .generateTexture(key, size, size);
      g.destroy();
    };
    make('anchor', 0xffffff, 30);
  }
  private createHeroes() {
    const defs: HeroRole[] = [
      'fighter',
      'tank',
      'support',
    ];
    for (const role of defs) {
      const c = HERO_CONFIG[role],
        p = formationDestination(WORLD.safeCenter, 'down', role);
      const shape = this.add.container(p.x, p.y).setDepth(3);
      const shadow = this.add.ellipse(0, 18, 40, 14, 0x101820, 0.28);
      const visual = this.add.circle(0, 0, 20, 0xffa64d).setStrokeStyle(4, 0x2b1a14, 0.9);
      shape.add([shadow, visual]);
      this.add
        .text(p.x, p.y - 34, c.name.split(' ')[0], { fontSize: '14px', color: '#fff' })
        .setOrigin(0.5)
        .setName(`${role}-label`);
      this.heroes.push({
        role,
        shape,
        visual,
        shadow,
        motion: createMotionState(role === 'tank' ? 'jelly' : role === 'support' ? 'floating' : 'normal'),
        lastPosition: { ...p },
        hp: c.maxHp,
        maxHp: c.maxHp,
        attack: c.attack,
        defense: c.defense,
        level: 1,
        experience: 0,
        lastAttack: -9999,
        status: 'alive',
      });
    }
  }
  private createMonsters() {
    MONSTER_SPAWNS.forEach((spawn, i) => {
      const radish = this.add.container(spawn.x, spawn.y);
      const shadow = this.add.ellipse(0, 18, 36, 13, 0x101820, 0.28);
      const body = this.add.ellipse(0, 3, 30, 40, 0x79d14d).setStrokeStyle(3, 0x263a20);
      const leaf = this.add.triangle(0, -23, -10, 8, 0, -10, 10, 8, 0xb6ee77);
      const visual = this.add.container(0, 0, [body, leaf]);
      const hp = this.add.rectangle(0, -32, 34, 4, 0x67e76e).setName('hp');
      radish.add([shadow, visual, hp]).setSize(32, 42).setInteractive();
      this.physics.add.existing(radish);
      const arcade = radish.body as Phaser.Physics.Arcade.Body;
      arcade.setCollideWorldBounds(true);
      this.physics.add.collider(radish, this.obstacles);
      this.mobs.push({
        id: `Radish ${i + 1}`,
        shape: radish,
        body: arcade,
        visual,
        shadow,
        motion: createMotionState('normal', 'right', (i % 9) / 9),
        lastPosition: { ...spawn },
        hp: MONSTER.maxHp,
        maxHp: MONSTER.maxHp,
        level: (i % 3) + 1,
        spawn,
        lastAttack: -9999,
        defeatedAt: 0,
        rewarded: false,
        status: 'alive',
      });
    });
  }
  update(time: number) {
    if (this.paused) return;
    const dir = this.manualDirection();
    if (dir) {
      this.cancelAuto();
      this.move(dir, HERO_CONFIG.fighter.moveSpeed);
    } else if (this.autoEnabled) this.updateAuto(time);
    else this.anchor.setVelocity(0);
    this.updateFormation(time);
    this.updateCombat(time);
    this.updateMonsters(time);
    this.updateRespawns(time);
    this.safeHeal();
    if (time - this.lastHud > 150) {
      this.publish(time);
      this.lastHud = time;
    }
  }
  private manualDirection(): Direction | null {
    if (this.controls.mobile) return this.controls.mobile;
    const left = this.keys.A.isDown || this.keys.LEFT.isDown,
      right = this.keys.D.isDown || this.keys.RIGHT.isDown,
      up = this.keys.W.isDown || this.keys.UP.isDown,
      down = this.keys.S.isDown || this.keys.DOWN.isDown;
    if (left !== right) return left ? 'left' : 'right';
    if (up !== down) return up ? 'up' : 'down';
    return null;
  }
  private move(d: Direction, speed: number) {
    this.facing = d;
    this.anchor.setVelocity(
      d === 'left' ? -speed : d === 'right' ? speed : 0,
      d === 'up' ? -speed : d === 'down' ? speed : 0,
    );
  }
  private updateFormation(time: number) {
    for (const h of this.heroes) {
      const dest = formationDestination(
        { x: this.anchor.x, y: this.anchor.y },
        this.facing,
        h.role,
      );
      if (Math.hypot(h.shape.x - dest.x, h.shape.y - dest.y) > 230)
        h.shape.setPosition(dest.x, dest.y);
      else {
        h.shape.x = Phaser.Math.Linear(h.shape.x, dest.x, 0.12);
        h.shape.y = Phaser.Math.Linear(h.shape.y, dest.y, 0.12);
      }
      h.motion = updateSingleSpriteMotion(h.motion, {
        velocityX: (h.shape.x - h.lastPosition.x) * 60,
        velocityY: (h.shape.y - h.lastPosition.y) * 60,
        nowMs: time,
      });
      h.lastPosition = { x: h.shape.x, y: h.shape.y };
      h.visual
        .setPosition(h.motion.visualX, h.motion.visualY)
        .setScale((h.motion.flipX ? -1 : 1) * h.motion.scaleX, h.motion.scaleY)
        .setAngle(h.motion.angle);
      h.shadow.setScale(h.motion.shadowScale).setAlpha(h.motion.shadowAlpha);
      const label = this.children.getByName(`${h.role}-label`) as Phaser.GameObjects.Text;
      label?.setPosition(h.shape.x, h.shape.y - 34);
      h.shape.setAlpha(h.status === 'alive' ? 1 : 0.25);
    }
  }
  private updateAuto(time: number) {
    const alive = this.heroes.filter((h) => h.status === 'alive'),
      ratio =
        alive.reduce((s, h) => s + h.hp, 0) /
        Math.max(
          1,
          alive.reduce((s, h) => s + h.maxHp, 0),
        );
    if (ratio < 0.25) {
      this.autoState = 'retreating';
      this.target = null;
      this.navigateTo(WORLD.safeCenter, time);
      return;
    }
    if (this.autoState === 'recovering') {
      this.anchor.setVelocity(0);
      if (ratio >= 0.8) this.autoState = 'acquiring-target';
      else return;
    }
    if (!this.target || this.target.status !== 'alive') {
      this.target = this.nearestReachable();
      if (!this.target) {
        this.autoState = 'waiting';
        this.anchor.setVelocity(0);
        return;
      }
      this.autoState = 'navigating';
      this.path = [];
    }
    const distance = Phaser.Math.Distance.Between(
      this.anchor.x,
      this.anchor.y,
      this.target.shape.x,
      this.target.shape.y,
    );
    if (distance <= 70) {
      this.anchor.setVelocity(0);
      this.autoState = 'engaging';
      return;
    }
    this.navigateTo({ x: this.target.shape.x, y: this.target.shape.y }, time);
  }
  private navigateTo(goal: Vector2, time: number) {
    if (isInSafeZone({ x: this.anchor.x, y: this.anchor.y }) && this.autoState === 'retreating') {
      this.autoState = 'recovering';
      this.anchor.setVelocity(0);
      return;
    }
    if (!this.path.length || time - this.lastPathAt > 700) {
      const p = findPath(
        prototypeMap,
        worldToTile({ x: this.anchor.x, y: this.anchor.y }),
        worldToTile(goal),
      );
      this.path = p?.slice(1).map(tileToWorld) ?? [];
      this.lastPathAt = time;
      if (!p) {
        this.autoState = 'waiting';
        return;
      }
    }
    const next = this.path[0];
    if (!next) return;
    const dx = next.x - this.anchor.x,
      dy = next.y - this.anchor.y;
    if (Math.hypot(dx, dy) < 10) {
      this.path.shift();
      return;
    }
    this.move(
      Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down',
      HERO_CONFIG.fighter.moveSpeed,
    );
  }
  private nearestReachable() {
    return (
      this.mobs
        .filter((m) => m.status === 'alive' && !isInSafeZone({ x: m.shape.x, y: m.shape.y }))
        .map((m) => ({
          m,
          d: Phaser.Math.Distance.Between(this.anchor.x, this.anchor.y, m.shape.x, m.shape.y),
          p: findPath(
            prototypeMap,
            worldToTile({ x: this.anchor.x, y: this.anchor.y }),
            worldToTile({ x: m.shape.x, y: m.shape.y }),
          ),
        }))
        .filter((x) => x.p)
        .sort((a, b) => a.d - b.d)[0]?.m ?? null
    );
  }
  private updateCombat(time: number) {
    for (const h of this.heroes) {
      if (h.status !== 'alive') continue;
      const targets = this.mobs
        .filter(
          (m) =>
            m.status === 'alive' &&
            Phaser.Math.Distance.Between(h.shape.x, h.shape.y, m.shape.x, m.shape.y) <=
              HERO_CONFIG[h.role].attackRange,
        )
        .sort(
          (a, b) =>
            Phaser.Math.Distance.Between(h.shape.x, h.shape.y, a.shape.x, a.shape.y) -
            Phaser.Math.Distance.Between(h.shape.x, h.shape.y, b.shape.x, b.shape.y),
        );
      const m = this.target && targets.includes(this.target) ? this.target : targets[0];
      if (m && time - h.lastAttack >= HERO_CONFIG[h.role].attackCooldownMs) {
        h.lastAttack = time;
        m.hp -= calculateDamage(h.attack, MONSTER.defense, () => 0.5);
        this.flash(m.shape.x, m.shape.y, 0xfff1a8);
        if (m.hp <= 0) this.defeatMonster(m, time);
      }
    }
  }
  private updateMonsters(time: number) {
    const hero = this.heroes.find((h) => h.status === 'alive');
    for (const m of this.mobs) {
      if (m.status === 'defeated') continue;
      m.motion = updateSingleSpriteMotion(m.motion, {
        velocityX: (m.shape.x - m.lastPosition.x) * 60,
        velocityY: (m.shape.y - m.lastPosition.y) * 60,
        nowMs: time,
      });
      m.lastPosition = { x: m.shape.x, y: m.shape.y };
      m.visual
        .setPosition(m.motion.visualX, m.motion.visualY)
        .setScale((m.motion.flipX ? -1 : 1) * m.motion.scaleX, m.motion.scaleY)
        .setAngle(m.motion.angle);
      m.shadow.setScale(m.motion.shadowScale).setAlpha(m.motion.shadowAlpha);
      const from = Phaser.Math.Distance.Between(m.shape.x, m.shape.y, m.spawn.x, m.spawn.y),
        to = hero
          ? Phaser.Math.Distance.Between(m.shape.x, m.shape.y, hero.shape.x, hero.shape.y)
          : Infinity;
      if (
        !hero ||
        isInSafeZone({ x: hero.shape.x, y: hero.shape.y }) ||
        from > MONSTER.leashRadius
      ) {
        this.moveMob(m, m.spawn);
        continue;
      }
      if (to <= MONSTER.aggroRadius) {
        if (to > MONSTER.attackRange) this.moveMob(m, { x: hero.shape.x, y: hero.shape.y });
        else {
          m.body.setVelocity(0);
          if (time - m.lastAttack >= MONSTER.attackCooldownMs) {
            m.lastAttack = time;
            hero.hp = Math.max(
              0,
              hero.hp - calculateDamage(MONSTER.attack, hero.defense, () => 0.5),
            );
            this.flash(hero.shape.x, hero.shape.y, 0xff6b6b);
            if (hero.hp === 0) {
              hero.status = 'defeated';
              if (this.heroes.every((h) => h.status === 'defeated')) this.beginWipe(time);
            }
          }
        }
      } else m.body.setVelocity(0);
    }
  }
  private moveMob(m: Mob, goal: Vector2) {
    const dx = goal.x - m.shape.x,
      dy = goal.y - m.shape.y,
      d = Math.hypot(dx, dy);
    if (d < 5) m.body.setVelocity(0);
    else m.body.setVelocity((dx / d) * MONSTER.moveSpeed, (dy / d) * MONSTER.moveSpeed);
  }
  private defeatMonster(m: Mob, time: number) {
    m.status = 'defeated';
    m.defeatedAt = time;
    m.body.setVelocity(0);
    m.shape.setVisible(false).disableInteractive();
    if (!m.rewarded) {
      m.rewarded = true;
      for (const h of this.heroes) {
        const p = applyExperience(
          {
            level: h.level,
            experience: h.experience,
            maxHp: h.maxHp,
            currentHp: h.hp,
            attack: h.attack,
            defense: h.defense,
          },
          h.status === 'alive' ? MONSTER.experienceReward : MONSTER.experienceReward * 0.5,
        );
        h.level = p.level;
        h.experience = p.experience;
        h.maxHp = p.maxHp;
        h.hp = p.currentHp;
        h.attack = p.attack;
        h.defense = p.defense;
      }
    }
    if (this.target === m) this.target = null;
  }
  private updateRespawns(time: number) {
    for (const m of this.mobs)
      if (m.status === 'defeated' && time - m.defeatedAt >= MONSTER.respawnMs) {
        m.status = 'alive';
        m.hp = m.maxHp;
        m.rewarded = false;
        m.shape.setPosition(m.spawn.x, m.spawn.y).setVisible(true).setInteractive();
      }
    if (this.wipeAt && time - this.wipeAt >= WORLD.heroRespawnMs) {
      for (const h of this.heroes) {
        h.hp = h.maxHp;
        h.status = 'alive';
      }
      this.anchor.setPosition(WORLD.safeCenter.x, WORLD.safeCenter.y);
      this.wipeAt = 0;
      this.autoEnabled = false;
      this.autoState = 'disabled';
      this.target = null;
      this.path = [];
    }
  }
  private beginWipe(time: number) {
    this.wipeAt = time;
    this.cancelAuto();
    this.anchor.setVelocity(0);
  }
  private safeHeal() {
    if (!isInSafeZone({ x: this.anchor.x, y: this.anchor.y })) return;
    for (const h of this.heroes)
      if (h.status === 'alive') h.hp = Math.min(h.maxHp, h.hp + (h.maxHp * 0.1) / 60);
  }
  private flash(x: number, y: number, color: number) {
    let f = this.fxPool.find((v) => !v.visible);
    if (!f) {
      f = this.add.circle(0, 0, 8, color);
      this.fxPool.push(f);
    }
    f.setPosition(x, y).setVisible(true).setAlpha(1);
    this.tweens.add({
      targets: f,
      alpha: 0,
      scale: 2,
      duration: 180,
      onComplete: () => f!.setVisible(false).setScale(1),
    });
  }
  toggleAuto() {
    if (this.paused || this.wipeAt) return;
    this.autoEnabled = !this.autoEnabled;
    this.autoState = this.autoEnabled ? 'acquiring-target' : 'disabled';
    this.path = [];
    this.target = null;
    this.publish(this.time.now);
  }
  togglePause() {
    if (!this.sys.isActive() || !this.physics.world) return;
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    this.autoState = this.paused ? 'disabled' : this.autoEnabled ? 'acquiring-target' : 'disabled';
    this.publish(this.time.now);
  }
  private cancelAuto() {
    if (!this.autoEnabled) return;
    this.autoEnabled = false;
    this.autoState = 'disabled';
    this.target = null;
    this.path = [];
  }
  private publish(time: number) {
    const leader = this.heroes[0];
    if (!leader) return;
    this.bridge.publish({
      level: leader.level,
      hp: leader.hp,
      maxHp: leader.maxHp,
      experience: leader.experience,
      nextExperience: requiredExperienceForNextLevel(leader.level),
      autoEnabled: this.autoEnabled,
      autoState: this.autoState,
      target: this.target?.id ?? 'None',
      living: this.heroes.filter((h) => h.status === 'alive').length,
      respawnSeconds: this.wipeAt
        ? Math.max(0, Math.ceil((WORLD.heroRespawnMs - (time - this.wipeAt)) / 1000))
        : 0,
      paused: this.paused,
      fps: Math.round(this.game.loop.actualFps || 60),
      position: `${Math.round(this.anchor.x)}, ${Math.round(this.anchor.y)}`,
    });
  }
  private onResize = (size: Phaser.Structs.Size) =>
    this.cameras.main.setViewport(0, 0, size.width, size.height);
  private onVisibility = () => {
    if (this.sys.isActive() && this.physics.world && document.hidden && !this.paused)
      this.togglePause();
  };
  private cleanup = () => {
    this.scale.off('resize', this.onResize, this);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.controls.mobile = null;
  };
}
