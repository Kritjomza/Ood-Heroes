import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { derivePlayerView } from './derived-player-view';
import { HeroMock } from './HeroMock';

export function HomeScreen({
  player,
  navigate,
  onPlayLocal,
  onPlayOnline,
}: {
  player: PlayerBootstrap;
  navigate: (screen: string) => void;
  onPlayLocal: () => void;
  onPlayOnline: () => void;
}) {
  const view = derivePlayerView(player);
  const activeHeroes = player.activeTeam.slots.flatMap((slot) => {
    const hero = player.heroes.find((entry) => entry.id === slot.playerHeroId);
    const definition = player.heroDefinitions.find((entry) => entry.id === hero?.definitionId);
    return hero && definition ? [{ hero, definition }] : [];
  });
  return (
    <section className="persistent-content home-screen expedition-home">
      <header className="adventure-page-heading">
        <div>
          <span className="page-kicker">Welcome back, {player.profile.displayName}</span>
          <h1>Your expedition</h1>
          <p>Floor 1 is ready for your odd little crew.</p>
        </div>
        <span className="floor-ticket">Floor 01</span>
      </header>
      <div className="expedition-board">
        <div className="active-party">
          <div className="party-copy">
            <h2>Active team</h2>
            <p>
              {view.team.occupied} of {view.team.capacity} slots ready
            </p>
          </div>
          <div className="party-stickers">
            {activeHeroes.length ? (
              activeHeroes.map(({ hero, definition }) => (
                <div className="party-hero" key={hero.id}>
                  <HeroMock assetId={definition.assetKey} size="small" />
                  <span>{definition.displayName}</span>
                </div>
              ))
            ) : (
              <button onClick={() => navigate('team')}>Choose your first hero</button>
            )}
          </div>
        </div>
        <div className="play-actions">
          <button
            className="plastic-button online-play"
            aria-label="Enter Floor 1 online"
            onClick={onPlayOnline}
          >
            <AdventureIcon name="play" />
            <span>
              <strong>Enter Floor 1</strong>
              <small>Online adventure</small>
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
    </section>
  );
}
