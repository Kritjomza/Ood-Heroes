import Phaser from 'phaser';
import type { Direction } from '@odd-tower/game-core';
import { GameScene } from './scenes/GameScene';
import type { GameBridge } from './bridge';
export type Controls = { mobile: Direction | null };
export function createGame(parent: HTMLElement, bridge: GameBridge, controls: Controls) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#101822',
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [
      class extends GameScene {
        constructor() {
          super(bridge, controls);
        }
      },
    ],
  });
}
