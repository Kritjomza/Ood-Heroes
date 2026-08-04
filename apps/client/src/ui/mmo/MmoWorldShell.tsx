import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import type { Direction } from '@odd-tower/game-core';
import type { MmoWorldUiState } from '../../mmo/MmoWorldBridge';
import { Joystick } from '../Joystick';

type DestroyableGame = Pick<Phaser.Game, 'destroy'>;

type Props = {
  state: Readonly<MmoWorldUiState>;
  onLeave: () => void;
  onMovement: (direction: Direction | 'idle') => void;
  onToggleAutoHunt?: () => void;
  autoHuntEnabled?: boolean;
  onTargetPreference?: () => void;
  createGame?: (parent: HTMLElement) => DestroyableGame;
};

export function MmoWorldShell({
  state,
  onLeave,
  onMovement,
  onToggleAutoHunt,
  autoHuntEnabled = false,
  onTargetPreference,
  createGame,
}: Props) {
  const worldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!worldRef.current) return;
    let disposed = false;
    let game: DestroyableGame | undefined;
    const parent = worldRef.current;
    if (createGame) {
      game = createGame(parent);
    } else {
      void import('../../mmo/createMmoWorldGame').then(({ createMmoWorldGame }) => {
        if (!disposed) game = createMmoWorldGame(parent);
      });
    }
    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, [createGame]);

  const zoneName =
    state.zoneId === 'floor-1' ? 'Verdant Approach' : state.zoneId || 'Adventure World';
  return (
    <main className="mmo-world-shell">
      <div ref={worldRef} className="mmo-world-canvas" aria-hidden="true" />
      <div className="mmo-safe-frame">
        {state.connection === 'recovering' && (
          <div className="mmo-reconnect" role="status">
            Restoring your adventure…
          </div>
        )}
        <header className="mmo-world-header">
          <div className="mmo-zone-plate">
            <p>{zoneName}</p>
            <span>{state.channelId}</span>
            <span className="mmo-population">{state.population} / 30 adventurers</span>
          </div>
          <button className="mmo-leave-button" type="button" onClick={onLeave}>
            Leave world
          </button>
        </header>
        <section className="mmo-activity-strip" aria-label="World activity">
          <span>{state.activeMonsterCount ?? 0} creatures active</span>
          <span>Zone activity {Math.round(state.zoneActivity ?? 0)}</span>
          {state.bossStatus === 'announced' && <strong role="status">Boss in {Math.ceil((state.bossCountdownTicks ?? 0) / 20)}s</strong>}
          {state.worldBossId && state.bossStatus !== 'announced' && <strong role="status">World boss active</strong>}
          {(state.pendingRewardCount ?? 0) > 0 && <span role="status">Saving rewards…</span>}
        </section>
        <section className="mmo-progression-strip" aria-label="Progression">
          <span>Progression synced</span>
          <span>Three heroes deployed</span>
        </section>
        <section className="mmo-party-strip" aria-label="Three hero party">
          <span className="mmo-hero-chip leader-chip"><strong>Leader</strong><small>Fighter</small></span>
          <span className="mmo-hero-chip"><strong>Guard</strong><small>Tank</small></span>
          <span className="mmo-hero-chip"><strong>Guide</strong><small>Support</small></span>
        </section>
        <button className="mmo-target-preference" type="button" onClick={onTargetPreference} disabled={!onTargetPreference}>
          Target nearest
        </button>
        <div className="mmo-world-controls">
          <Joystick onDirection={(direction) => onMovement(direction ?? 'idle')} />
          <p className="mmo-control-hint">Move your Leader</p>
          {onToggleAutoHunt && (
            <button
              className={`mmo-auto-hunt ${autoHuntEnabled ? 'is-active' : ''}`}
              type="button"
              onClick={onToggleAutoHunt}
              aria-pressed={autoHuntEnabled}
            >
              {autoHuntEnabled ? 'Auto Hunt on' : 'Auto Hunt off'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
