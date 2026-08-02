import { useEffect, useMemo, useState } from 'react';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { deriveTeamView } from './derived-player-view';
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
  const initial = useMemo(
    () =>
      [...player.activeTeam.slots]
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((slot) => slot.playerHeroId),
    [player.activeTeam.slots],
  );
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [initial]);
  const view = deriveTeamView(player, selected);
  const dirty = selected.join('|') !== initial.join('|');
  return (
    <section className="persistent-content team-screen">
      <ScreenHeading title="Formation board" subtitle="Battle order matters" back={back} />
      <div className="team-summary">
        <span>
          <strong>{view.averageLevel}</strong>Average level
        </span>
        <span>
          <strong>{view.totalStars}</strong>
          Total stars
        </span>
        <span>
          <strong>
            {view.occupied}/{view.capacity}
          </strong>
          Slots filled
        </span>
      </div>
      {view.duplicateRoles.length > 0 && (
        <p className="role-warning">
          <AdventureIcon name="shield" />
          Two {view.duplicateRoles[0]}s — sturdy, but less varied.
        </p>
      )}
      <div className="formation-board">
        {[0, 1, 2].map((index) => {
          const unlocked = index < player.profile.teamSlots;
          const hero = player.heroes.find((entry) => entry.id === selected[index]);
          const definition = player.heroDefinitions.find(
            (entry) => entry.id === hero?.definitionId,
          );
          return (
            <div key={index} className={`formation-slot ${unlocked ? '' : 'locked'}`}>
              <span className="slot-number">{index + 1}</span>
              {definition ? (
                <>
                  <HeroMock assetId={definition.assetKey} />
                  <strong>{definition.displayName}</strong>
                  <small>
                    {definition.role} · Lv {hero?.level}
                  </small>
                </>
              ) : (
                <>
                  <AdventureIcon name={unlocked ? 'heroes' : 'lock'} />
                  <strong>{unlocked ? 'Open slot' : 'Locked slot'}</strong>
                  <small>
                    {unlocked
                      ? 'Choose from the roster'
                      : index === 2
                        ? '3 heroes + 500 gold'
                        : 'Own 2 heroes'}
                  </small>
                </>
              )}
            </div>
          );
        })}
      </div>
      <h2 className="roster-title">Your roster</h2>
      <div className="team-picker formation-roster">
        {player.heroes.map((hero) => {
          const definition = player.heroDefinitions.find(
            (entry) => entry.id === hero.definitionId,
          )!;
          const active = selected.includes(hero.id);
          return (
            <button
              key={hero.id}
              className={active ? 'selected' : ''}
              aria-pressed={active}
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
              <span>
                <strong>{definition.displayName}</strong>
                <small>
                  {definition.role} · Lv {hero.level} · {hero.stars} stars
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="team-actions">
        {player.profile.teamSlots < 3 && player.heroes.length >= 3 && (
          <button
            className="plastic-button unlock-slot"
            disabled={busy || player.currencies.gold < 500}
            onClick={unlock}
          >
            <AdventureIcon name="lock" />
            Unlock slot 3 · 500 gold
          </button>
        )}
        <button
          className="plastic-button save-formation"
          disabled={busy || selected.length === 0 || !dirty}
          onClick={() => save(selected)}
        >
          <AdventureIcon name="save" />
          {busy ? 'Saving…' : 'Save formation'}
        </button>
      </div>
    </section>
  );
}
