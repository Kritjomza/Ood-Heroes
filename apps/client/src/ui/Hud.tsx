import { useEffect, useState } from 'react';
import type { GameBridge, HudState } from '../game/bridge';
import { initialHudState } from '../game/bridge';
export function Hud({
  bridge,
  onToggleAuto,
  onPause,
}: {
  bridge: GameBridge;
  onToggleAuto: () => void;
  onPause: () => void;
}) {
  const [s, setState] = useState<HudState>(initialHudState);
  useEffect(() => bridge.subscribe(setState), [bridge]);
  return (
    <div className="hud" data-testid="hud">
      <section className="team-panel">
        <strong>Lv. {s.level} Grilled Chicken</strong>
        <span>
          HP {Math.ceil(s.hp)} / {s.maxHp}
        </span>
        <progress aria-label="Leader health" value={s.hp} max={s.maxHp} />
        <span>
          EXP {s.experience} / {s.nextExperience}
        </span>
        <progress aria-label="Leader experience" value={s.experience} max={s.nextExperience} />
        <span>Team alive: {s.living}/3</span>
      </section>
      <section className="status-panel">
        <span>Target: {s.target}</span>
        <span>Auto: {s.autoState}</span>
        <span data-testid="position">Position: {s.position}</span>
        <span>FPS: {s.fps}</span>
      </section>
      <div className="actions">
        <button
          className={s.autoEnabled ? 'active' : ''}
          aria-pressed={s.autoEnabled}
          onClick={onToggleAuto}
        >
          Auto Hunt {s.autoEnabled ? 'ON' : 'OFF'}
        </button>
        <button onClick={onPause}>Pause</button>
      </div>
      {s.respawnSeconds > 0 && <div className="respawn">Respawn in {s.respawnSeconds}</div>}
      {s.paused && (
        <div role="dialog" aria-modal="true" className="pause">
          <h2>Paused</h2>
          <button onClick={onPause}>Resume</button>
        </div>
      )}
      <div className="keyboard-help">WASD / Arrows: Move · Space: Auto Hunt · Esc: Pause</div>
    </div>
  );
}
