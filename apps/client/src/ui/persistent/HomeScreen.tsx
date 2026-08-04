import { useEffect, useRef, useState } from 'react';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { derivePlayerView } from './derived-player-view';
import { HeroMock } from './HeroMock';

export function HomeScreen({
  player,
  navigate,
  onPlayLocal,
  onPlayOnline,
  onContinueMmo,
}: {
  player: PlayerBootstrap;
  navigate: (screen: string) => void;
  onPlayLocal: () => void;
  onPlayOnline: () => void;
  onContinueMmo?: () => void;
}) {
  const view = derivePlayerView(player);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const enterRef = useRef<HTMLButtonElement>(null);
  const activeHeroes = player.activeTeam.slots.flatMap((slot) => {
    const hero = player.heroes.find((entry) => entry.id === slot.playerHeroId);
    const definition = player.heroDefinitions.find((entry) => entry.id === hero?.definitionId);
    return hero && definition ? [{ hero, definition }] : [];
  });
  useEffect(() => {
    if (!briefingOpen) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setBriefingOpen(false);
    window.addEventListener('keydown', close);
    enterRef.current?.focus();
    return () => window.removeEventListener('keydown', close);
  }, [briefingOpen]);

  return (
    <section className="persistent-content home-screen expedition-home adventure-screen">
      <header className="adventure-page-heading lobby-heading">
        <div>
          <h1>Welcome back, {player.profile.displayName}</h1>
          <p>Your odd little crew is waiting at the tower gate.</p>
        </div>
        <span className="floor-ticket">Floor 01</span>
      </header>

      <div className="expedition-board hero-gate-board">
        <div className="active-party hero-gate-stage">
          <div className="party-copy">
            <h2>Active crew</h2>
            <p>
              {view.team.occupied} of {view.team.capacity} slots ready
            </p>
          </div>
          <div className="party-stickers" aria-label="Current party formation">
            {activeHeroes.map(({ hero, definition }, index) => (
              <div className="party-hero" key={hero.id}>
                <span className="party-slot-label">Slot {index + 1}</span>
                <HeroMock assetId={definition.assetKey} />
                <strong>{definition.displayName}</strong>
                <small>
                  {definition.role} · Lv {hero.level}
                </small>
              </div>
            ))}
            {Array.from(
              { length: Math.max(0, view.team.capacity - activeHeroes.length) },
              (_, index) => (
                <button
                  className="empty-party-slot"
                  key={`empty-${index}`}
                  onClick={() => navigate('team')}
                >
                  <span aria-hidden="true">+</span>
                  <strong>Open slot</strong>
                  <small>Choose a hero</small>
                </button>
              ),
            )}
          </div>
        </div>

        <aside className="mission-gate" aria-label="Next tower mission">
          <div className="mission-sign">
            <span>Next adventure</span>
            <h2>Floor 01</h2>
            <p>The Crooked Welcome Hall</p>
          </div>
          <div className="mission-stats">
            <span>
              <small>Status</small>
              <strong>Online</strong>
            </span>
            <span>
              <small>Party</small>
              <strong>
                {view.team.occupied}/{view.team.capacity} ready
              </strong>
            </span>
            <span>
              <small>Expected</small>
              <strong>Gold · XP</strong>
            </span>
          </div>
          <button className="mission-details" onClick={() => setBriefingOpen(true)}>
            View mission briefing
          </button>
          <div className="play-actions">
            <button
              className="plastic-button online-play primary-play-button"
              aria-label={onContinueMmo ? 'Continue Adventure online' : 'Enter Floor 1 online'}
              onClick={onContinueMmo ?? onPlayOnline}
            >
              <AdventureIcon name="play" />
              <span>
                <strong>{onContinueMmo ? 'Continue Adventure' : 'Enter Floor 1'}</strong>
                <small>{onContinueMmo ? 'Persistent shared world' : 'Online adventure'}</small>
              </span>
            </button>
            <button className="plastic-button local-play" onClick={onPlayLocal}>
              <AdventureIcon name="home" />
              <span>
                <strong>Practice run</strong>
                <small>Local prototype</small>
              </span>
            </button>
          </div>
        </aside>
      </div>

      <div className="progress-ribbon" aria-label="Adventure progress">
        <button onClick={() => navigate('collection')}>
          <AdventureIcon name="heroes" />
          <span>
            <strong>
              {view.collection.owned} of {view.collection.total} heroes
            </strong>
            <small>{view.collection.percent}% collected</small>
          </span>
        </button>
        <button onClick={() => navigate('summon')}>
          <AdventureIcon name="summon" />
          <span>
            <strong>{view.affordableSummons} summons ready</strong>
            <small>
              {player.banner.pullsSinceEpic}/{player.banner.pityThreshold} pity
            </small>
          </span>
        </button>
        <button onClick={() => navigate('team')}>
          <AdventureIcon name="team" />
          <span>
            <strong>{view.collection.upgradeReady} upgrades ready</strong>
            <small>{view.team.totalStars} team stars</small>
          </span>
        </button>
      </div>

      {briefingOpen && (
        <div className="game-modal-backdrop" onMouseDown={() => setBriefingOpen(false)}>
          <section
            className="mission-briefing"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close mission briefing"
              onClick={() => setBriefingOpen(false)}
            >
              ×
            </button>
            <span className="briefing-ribbon">Tower mission</span>
            <h2 id="mission-title">Floor 01 · The Crooked Welcome Hall</h2>
            <p>
              Bring your active crew into the shared tower. Other adventurers may be climbing
              nearby.
            </p>
            <div className="briefing-party">
              {activeHeroes.map(({ hero, definition }) => (
                <div key={hero.id}>
                  <HeroMock assetId={definition.assetKey} size="small" />
                  <span>
                    {definition.displayName}
                    <small>
                      Lv {hero.level} · {definition.role}
                    </small>
                  </span>
                </div>
              ))}
            </div>
            <div className="briefing-rewards">
              <span>
                <small>Available rewards</small>
                <strong>Gold · Hero XP · Upgrade drops</strong>
              </span>
              <span>
                <small>Connection</small>
                <strong>Online shared floor</strong>
              </span>
            </div>
            <div className="briefing-actions">
              <button className="plastic-button local-play" onClick={() => setBriefingOpen(false)}>
                Back
              </button>
              <button ref={enterRef} className="plastic-button online-play" onClick={onPlayOnline}>
                Enter tower
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
