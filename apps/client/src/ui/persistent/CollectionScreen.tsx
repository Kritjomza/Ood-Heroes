import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { HeroMock } from './HeroMock';

export function CollectionScreen({
  player,
  back,
  selectHero,
}: {
  player: PlayerBootstrap;
  back: () => void;
  selectHero: (id: string) => void;
}) {
  const owned = new Map(player.heroes.map((hero) => [hero.definitionId, hero]));
  return (
    <section className="persistent-content">
      <ScreenHeading
        title="Hero Collection"
        back={back}
        subtitle={`${player.heroes.length} of 6 found`}
      />
      <div className="hero-grid">
        {player.heroDefinitions.map((definition) => {
          const hero = owned.get(definition.id);
          return (
            <button
              key={definition.id}
              className={`hero-card rarity-${definition.rarity} ${hero ? '' : 'hero-locked'}`}
              onClick={() => hero && selectHero(hero.id)}
              aria-label={`${definition.displayName}, ${hero ? 'owned' : 'not owned'}`}
            >
              <HeroMock assetId={definition.assetKey} />
              <strong>{hero ? definition.displayName : 'Unknown Oddity'}</strong>
              <span>
                {hero ? `Level ${hero.level} · ${'★'.repeat(hero.stars)}` : 'Summon to discover'}
              </span>
              <small>
                {definition.role} · {definition.rarity}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ScreenHeading({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back: () => void;
}) {
  return (
    <header className="screen-heading">
      <button className="icon-action" onClick={back} aria-label="Back">
        ←
      </button>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
