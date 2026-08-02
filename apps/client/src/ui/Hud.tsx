import { useEffect, useState } from 'react';
import type { GameBridge, HudState } from '../game/bridge';
import { initialHudState } from '../game/bridge';
import { TowerHud } from './tower/TowerHud';
import { createLocalTowerHudModel } from './tower/towerHudModel';

export function Hud({ bridge, onToggleAuto, onPause, onLeave }: { bridge: GameBridge; onToggleAuto: () => void; onPause: () => void; onLeave?: () => void }) {
  const [state, setState] = useState<HudState>(initialHudState);
  useEffect(() => bridge.subscribe(setState), [bridge]);
  return (
    <>
      <TowerHud model={createLocalTowerHudModel(state)} onToggleAuto={onToggleAuto} onPause={onPause} onLeave={onLeave} />
      <span className="hud-debug-position" data-testid="position">{state.position}</span>
      {state.paused && <div role="dialog" aria-modal="true" className="pause"><h2>Paused for snack inspection</h2><button onClick={onPause}>Resume adventure</button></div>}
    </>
  );
}
