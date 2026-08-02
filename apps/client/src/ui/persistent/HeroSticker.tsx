import type { HeroDefinition, PlayerHero } from '@odd-tower/network-protocol';
import { HeroMock } from './HeroMock';
import { AdventureIcon } from './AdventureIcons';

export function HeroSticker({
  definition,
  hero,
  activeSlot,
  onSelect,
}: {
  definition: HeroDefinition;
  hero?: PlayerHero;
  activeSlot?: number;
  onSelect?: () => void;
}) {
  const label = hero
    ? `${definition.displayName}, owned, level ${hero.level}`
    : `${definition.displayName}, not owned`;
  return (
    <button
      className={`album-sticker rarity-${definition.rarity} ${hero ? '' : 'hero-locked'}`}
      aria-label={label}
      disabled={!hero}
      onClick={onSelect}
    >
      <span className="sticker-art">
        <HeroMock assetId={definition.assetKey} />
      </span>
      <span className="sticker-copy">
        <strong>{hero ? definition.displayName : 'Unknown Oddity'}</strong>
        <span className="sticker-meta">
          <b>{definition.rarity}</b>
          <b>{definition.role}</b>
          {activeSlot && <b>Team {activeSlot}</b>}
        </span>
        {hero ? (
          <small>
            Level {hero.level} · {hero.stars} stars · {hero.shards} shards
          </small>
        ) : (
          <small>
            <AdventureIcon name="lock" />
            Summon to discover
          </small>
        )}
      </span>
    </button>
  );
}
