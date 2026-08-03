import type { Vector2 } from '@odd-tower/game-core';

export type CameraTarget = { setPosition(x: number, y: number): unknown };

export function syncCameraTarget(target: CameraTarget, position: Vector2) {
  target.setPosition(position.x, position.y);
}

