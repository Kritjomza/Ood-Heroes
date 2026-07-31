import { useEffect, useState } from 'react';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { HeroMock } from './HeroMock';
import { ScreenHeading } from './CollectionScreen';

export function TeamBuilderScreen({
  player,
  back,
  save,
  unlock,
  busy,
}: {
  player: PlayerBootstrap;
  back: () => void;
  save: (ids: string[]) => void;
  unlock: () => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState(
    player.activeTeam.slots.map((slot) => slot.playerHeroId),
  );
  useEffect(
    () => setSelected(player.activeTeam.slots.map((slot) => slot.playerHeroId)),
    [player.activeTeam],
  );
  return (
    <section className="persistent-content">
      <ScreenHeading title="Team Builder" subtitle="Tap Heroes in battle order" back={back} />
      <div className="team-slots">
        {[0, 1, 2].map((index) => {
          const unlocked = index < player.profile.teamSlots;
          const hero = player.heroes.find((entry) => entry.id === selected[index]);
          const definition = player.heroDefinitions.find(
            (entry) => entry.id === hero?.definitionId,
          );
          return (
            <div key={index} className={`team-slot ${unlocked ? '' : 'locked'}`}>
              <strong>Slot {index + 1}</strong>
              {definition ? (
                <HeroMock assetId={definition.assetKey} size="small" />
              ) : (
                <span aria-hidden="true">{unlocked ? '+' : '🔒'}</span>
              )}
              <small>
                {definition?.displayName ??
                  (unlocked
                    ? 'Choose a Hero'
                    : index === 2
                      ? '500 Gold · 3 Heroes'
                      : 'Own 2 Heroes')}
              </small>
            </div>
          );
        })}
      </div>
      <div className="team-picker">
        {player.heroes.map((hero) => {
          const definition = player.heroDefinitions.find(
            (entry) => entry.id === hero.definitionId,
          )!;
          const active = selected.includes(hero.id);
          return (
            <button
              key={hero.id}
              className={active ? 'selected' : ''}
              onClick={() =>
                setSelected((current) =>
                  active
                    ? current.filter((id) => id !== hero.id)
                    : current.length < player.profile.teamSlots
                      ? [...current, hero.id]
                      : current,
                )
              }
            >
              <HeroMock assetId={definition.assetKey} size="small" />
              <span>{definition.displayName}</span>
            </button>
          );
        })}
      </div>
      {player.profile.teamSlots < 3 && player.heroes.length >= 3 && (
        <button
          className="secondary-action"
          disabled={busy || player.currencies.gold < 500}
          onClick={unlock}
        >
          Unlock Slot 3 · 🪙 500
        </button>
      )}
      <button
        className="primary-action"
        disabled={busy || selected.length === 0}
        onClick={() => save(selected)}
      >
        Save Complete Team
      </button>
    </section>
  );
}
