import { useMemo, useState } from 'react';
import type { PersistentHeroRole, PlayerBootstrap } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { derivePlayerView } from './derived-player-view';
import { HeroSticker } from './HeroSticker';

export function CollectionScreen({
  player,
  back,
  selectHero,
}: {
  player: PlayerBootstrap;
  back: () => void;
  selectHero: (id: string) => void;
}) {
  const [role, setRole] = useState<PersistentHeroRole | 'all'>('all');
  const view = derivePlayerView(player);
  const owned = new Map(player.heroes.map((hero) => [hero.definitionId, hero]));
  const roles = [...new Set(player.heroDefinitions.map((definition) => definition.role))];
  const definitions = useMemo(
    () => player.heroDefinitions.filter((definition) => role === 'all' || definition.role === role),
    [player.heroDefinitions, role],
  );
  return (
    <section className="persistent-content collection-screen">
      <ScreenHeading
        title="Hero album"
        subtitle={`${view.collection.percent}% collected`}
        back={back}
      />
      <div className="album-summary">
        <strong>
          {view.collection.owned}
          <small>owned</small>
        </strong>
        <strong>
          {view.collection.total}
          <small>oddities</small>
        </strong>
        <strong>
          {view.collection.upgradeReady}
          <small>ready to grow</small>
        </strong>
      </div>
      <div className="album-filters" aria-label="Hero filters">
        <button aria-pressed={role === 'all'} onClick={() => setRole('all')}>
          All
        </button>
        {roles.map((item) => (
          <button
            key={item}
            aria-label={`${item} filter`}
            aria-pressed={role === item}
            onClick={() => setRole(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="sticker-album">
        {definitions.map((definition) => {
          const hero = owned.get(definition.id);
          const slot = player.activeTeam.slots.find(
            (entry) => entry.playerHeroId === hero?.id,
          )?.slotIndex;
          return (
            <HeroSticker
              key={definition.id}
              definition={definition}
              hero={hero}
              activeSlot={slot}
              onSelect={() => hero && selectHero(hero.id)}
            />
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
    <header className="screen-heading adventure-screen-heading">
      <button className="icon-action" onClick={back} aria-label="Back">
        <AdventureIcon name="back" />
      </button>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
