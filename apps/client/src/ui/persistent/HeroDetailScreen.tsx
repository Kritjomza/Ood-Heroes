import { starUpgradeCost } from '@odd-tower/game-core';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { HeroMock } from './HeroMock';
import { ScreenHeading } from './CollectionScreen';

export function HeroDetailScreen({
  player,
  heroId,
  back,
  upgrade,
  busy,
}: {
  player: PlayerBootstrap;
  heroId: string;
  back: () => void;
  upgrade: (heroId: string) => void;
  busy: boolean;
}) {
  const hero = player.heroes.find((entry) => entry.id === heroId);
  const definition = player.heroDefinitions.find((entry) => entry.id === hero?.definitionId);
  if (!hero || !definition)
    return (
      <section className="persistent-content">
        <ScreenHeading title="Hero not found" back={back} />
      </section>
    );
  const cost = starUpgradeCost(hero.stars);
  return (
    <section className="persistent-content">
      <ScreenHeading
        title={definition.displayName}
        subtitle={`${definition.role} · ${definition.rarity}`}
        back={back}
      />
      <div className={`detail-card sticker-card rarity-${definition.rarity}`}>
        <HeroMock assetId={definition.assetKey} />
        <div className="star-line" aria-label={`${hero.stars} Stars`}>
          {'★'.repeat(hero.stars)}
          {'☆'.repeat(5 - hero.stars)}
        </div>
        <h2>Level {hero.level}</h2>
        <p>Total EXP: {hero.totalExperience.toLocaleString()} / 22,864</p>
        <p>Shards: {hero.shards}</p>
        {cost === null ? (
          <strong>Maximum Stars reached</strong>
        ) : (
          <button
            className="primary-action"
            disabled={busy || hero.shards < cost}
            onClick={() => upgrade(hero.id)}
          >
            Upgrade Star · {cost} Shards
          </button>
        )}
      </div>
    </section>
  );
}
