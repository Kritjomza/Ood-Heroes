import type { AutoHuntState } from '@odd-tower/game-core';
export type HudState = {
  level: number;
  hp: number;
  maxHp: number;
  experience: number;
  nextExperience: number;
  autoEnabled: boolean;
  autoState: AutoHuntState;
  target: string;
  living: number;
  respawnSeconds: number;
  paused: boolean;
  fps: number;
  position: string;
};
export const initialHudState: HudState = {
  level: 1,
  hp: 110,
  maxHp: 110,
  experience: 0,
  nextExperience: 50,
  autoEnabled: false,
  autoState: 'disabled',
  target: 'None',
  living: 3,
  respawnSeconds: 0,
  paused: false,
  fps: 60,
  position: '1024, 1024',
};
export class GameBridge {
  private listeners = new Set<(s: HudState) => void>();
  state = { ...initialHudState };
  get listenerCount() {
    return this.listeners.size;
  }
  subscribe(fn: (s: HudState) => void) {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }
  publish(s: HudState) {
    this.state = s;
    for (const fn of this.listeners) fn(s);
  }
}
