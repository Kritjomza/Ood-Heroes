import type { TowerHudModel } from './towerHudModel';
import { TowerMinimap } from './TowerMinimap';
import './tower-hud.css';

export function TowerHud({ model, onToggleAuto, onPause, onLeave }: { model: TowerHudModel; onToggleAuto: () => void; onPause: () => void; onLeave?: () => void }) {
  const hearts = Array.from({ length: model.partySize }, (_, i) => i < model.partyAlive);
  return (
    <div className="tower-hud" data-testid={model.mode === 'online' ? 'online-hud' : 'hud'}>
      <section className="tower-party sticker-panel" aria-label="Party status">
        <div className="leader-face" aria-hidden="true">🍗</div>
        <div className="party-copy"><div><b className="level-pill">LV {model.level}</b><strong>{model.playerName}</strong></div>
          <div className="meter hp-meter"><span style={{ width: `${model.healthRatio * 100}%` }} /><em>HP {Math.ceil(model.health)} / {model.maxHealth}</em></div>
          <div className="meter xp-meter"><span style={{ width: `${model.experienceRatio * 100}%` }} /><em>XP {model.experience} / {model.nextExperience}</em></div>
          <div className="party-pips" aria-label={`${model.partyAlive} of ${model.partySize} heroes alive`}>{hearts.map((alive, i) => <i key={i} className={alive ? 'alive' : 'down'}>{alive ? '♥' : '×'}</i>)}</div>
        </div>
      </section>

      <section className="floor-plaque sticker-panel"><small>{model.modeLabel}</small><strong>Floor 1 · The Odd Beginning</strong><div className="objective-meter"><span style={{ width: `${model.objectiveRatio * 100}%` }} /></div><em>{model.objective}</em></section>

      <section className="session-pill sticker-panel"><i className={`connection-dot ${model.mode}`} /><b>{model.connectionLabel}</b><i aria-hidden="true">👥</i><span>{model.capacityLabel}</span><span>{model.latencyLabel}</span><button aria-label="Pause game" onClick={onPause}>Ⅱ</button>{onLeave && <button aria-label="Leave Room" onClick={onLeave}>↩</button>}</section>

      <nav className="tower-rail" aria-label="Tower tools"><button aria-label="Inventory locked" disabled>🎒<small>Locked</small></button><button className={model.autoEnabled ? 'active' : ''} aria-label="Auto Hunt" aria-pressed={model.autoEnabled} onClick={onToggleAuto}>⚔<small>{model.autoEnabled ? model.autoState.toUpperCase() : 'AUTO'}</small></button><button aria-label="Toggle map">🗺<small>MAP</small></button></nav>

      <section className="quest-feed sticker-panel"><b>Odd Job</b><span>{model.objective}</span><small>Target: {model.target} · 🪙 {model.gold}</small></section>
      <TowerMinimap />

      <nav className="action-dock sticker-panel" aria-label="Actions"><button aria-label="Primary attack"><kbd>1</kbd>💥<small>Bonk</small></button><button aria-label="Special skill"><kbd>2</kbd>🌀<small>Odd skill</small></button><button aria-label="Recovery"><kbd>3</kbd>💗<small>Snack</small></button><button aria-label="Interact" disabled><kbd>E</kbd>🚪<small>Interact</small></button></nav>
      {model.respawnSeconds > 0 && <div className="tower-respawn" role="status"><strong>Team became pancakes.</strong><span>Unflattening in {model.respawnSeconds}s</span></div>}
    </div>
  );
}
