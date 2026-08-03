import { useEffect, useRef, useState } from 'react';
import { FLOOR_ONE_MAP } from '@odd-tower/game-core';
import { createFloorOneMinimapModel, type FloorOneMinimapModel, type TowerHudModel } from './towerHudModel';
import { TowerMinimap } from './TowerMinimap';
import './tower-hud.css';

const fallbackMinimap = createFloorOneMinimapModel({ map: FLOOR_ONE_MAP, tileSize: 32, player: { x: 1024, y: 1472, facing: 'down' } });

function HudIcon({ name }: { name: 'hero' | 'bag' | 'auto' | 'map' | 'bonk' | 'skill' | 'snack' | 'door' | 'pause' | 'leave' }) {
  const paths: Record<typeof name, string> = {
    hero: 'M12 3a6 6 0 0 0-6 6v3c0 5 3 8 6 9 3-1 6-4 6-9V9a6 6 0 0 0-6-6Zm-3 8h.01M15 11h.01M9 15c2 1 4 1 6 0',
    bag: 'M7 8V6a5 5 0 0 1 10 0v2M5 8h14l1 13H4L5 8Z',
    auto: 'M5 19 19 5M7 5l12 12M3 9h5M16 15h5',
    map: 'm3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Zm5-2v13m8-10v13',
    bonk: 'm4 15 7-7 5 5-7 7H4v-5Zm9-9 2-2 5 5-2 2',
    skill: 'M12 3a9 9 0 1 1-9 9c0-4 3-6 6-6 4 0 6 3 6 6 0 2-1 4-3 4-2 0-3-1-3-3',
    snack: 'M4 10h16v2a8 8 0 0 1-16 0v-2Zm3-3c0-2 2-3 5-3s5 1 5 3',
    door: 'M6 3h12v18H6V3Zm8 9h.01',
    pause: 'M8 5v14M16 5v14',
    leave: 'M10 5H5v14h5M14 8l4 4-4 4M8 12h10',
  };
  return <svg className="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export function TowerHud({ model, minimap = fallbackMinimap, onToggleAuto, onPause, onLeave }: { model: TowerHudModel; minimap?: FloorOneMinimapModel; onToggleAuto: () => void; onPause: () => void; onLeave?: () => void }) {
  const hearts = Array.from({ length: model.partySize }, (_, index) => index < model.partyAlive);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapOpenerRef = useRef<HTMLButtonElement>(null);
  const closeMap = () => {
    setMapExpanded(false);
    mapOpenerRef.current?.focus();
  };

  useEffect(() => {
    if (!mapExpanded) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && closeMap();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mapExpanded]);

  return (
    <div className="tower-hud" data-testid={model.mode === 'online' ? 'online-hud' : 'hud'}>
      <section className="tower-party tower-leader-plaque sticker-panel" aria-label="Party status">
        <div className="leader-face" aria-hidden="true"><HudIcon name="hero" /></div>
        <div className="party-copy"><div><b className="level-pill">LV {model.level}</b><strong>{model.playerName}</strong></div>
          <div className="meter hp-meter"><span style={{ width: `${model.healthRatio * 100}%` }} /><em>HP {Math.ceil(model.health)} / {model.maxHealth}</em></div>
          <div className="meter xp-meter"><span style={{ width: `${model.experienceRatio * 100}%` }} /><em>XP {model.experience} / {model.nextExperience}</em></div>
          <div className="party-pips" aria-label={`${model.partyAlive} of ${model.partySize} heroes alive`}>{hearts.map((alive, index) => <i key={index} className={alive ? 'alive' : 'down'}>{alive ? '♥' : '×'}</i>)}</div>
        </div>
      </section>

      <section className="floor-plaque tower-floor-ribbon sticker-panel" aria-label="Floor objective"><small>{model.modeLabel}</small><strong>Floor 1 · The Odd Beginning</strong><div className="objective-meter"><span style={{ width: `${model.objectiveRatio * 100}%` }} /></div><em>{model.objective}</em></section>

      <section className="session-pill sticker-panel"><i className={`connection-dot ${model.mode}`} /><b>{model.connectionLabel}</b><span>{model.capacityLabel}</span><span>{model.latencyLabel}</span><button aria-label="Pause game" onClick={onPause}><HudIcon name="pause" /><small>Pause</small></button>{onLeave && <button aria-label="Leave Room" onClick={onLeave}><HudIcon name="leave" /><small>Leave</small></button>}</section>

      <nav className="tower-rail tower-tool-rail" aria-label="Tower tools"><button aria-label="Inventory locked" disabled><HudIcon name="bag" /><small>Locked</small></button><button className={model.autoEnabled ? 'active' : ''} aria-label="Auto Hunt" aria-pressed={model.autoEnabled} onClick={onToggleAuto}><HudIcon name="auto" /><small>{model.autoEnabled ? model.autoState.toUpperCase() : 'AUTO'}</small></button><button aria-label="Show map tool" onClick={() => setMapExpanded(true)}><HudIcon name="map" /><small>Map</small></button></nav>

      <section className="quest-feed tower-job-ticket sticker-panel"><b>Odd Job</b><span>{model.objective}</span><small>Target: {model.target} · {model.mode === 'online' ? 'Session Gold' : 'Gold'}: {model.gold}</small></section>
      <TowerMinimap model={minimap} expanded={mapExpanded} onOpen={() => setMapExpanded(true)} onClose={closeMap} openerRef={mapOpenerRef} />

      <nav className="action-dock tower-action-dock sticker-panel" aria-label="Combat actions"><button aria-label="Bonk primary attack"><kbd>1</kbd><HudIcon name="bonk" /><small>Bonk</small></button><button aria-label="Odd skill"><kbd>2</kbd><HudIcon name="skill" /><small>Odd skill</small></button><button aria-label="Snack recovery"><kbd>3</kbd><HudIcon name="snack" /><small>Snack</small></button><button aria-label="Interact" disabled><kbd>E</kbd><HudIcon name="door" /><small>Interact</small></button></nav>
      {model.respawnSeconds > 0 && <div className="tower-respawn" role="status" aria-label="Team respawn"><strong>The squad became floor decorations.</strong><span>Respawn in {model.respawnSeconds}s</span></div>}
    </div>
  );
}
