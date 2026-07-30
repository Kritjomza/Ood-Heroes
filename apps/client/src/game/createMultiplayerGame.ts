import Phaser from 'phaser';
import type { MultiplayerClient } from './multiplayer/MultiplayerClient';
import { MultiplayerScene, type OnlineControls } from './scenes/MultiplayerScene';

export function createMultiplayerGame(
  parent: HTMLElement,
  client: MultiplayerClient,
  controls: OnlineControls,
) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#101822',
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [
      class extends MultiplayerScene {
        constructor() {
          super(client, controls);
        }
      },
    ],
  });
}
