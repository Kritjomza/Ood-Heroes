import { useRef, useState } from 'react';
import type { PlayerBootstrap, SummonResult } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { ScreenHeading } from './CollectionScreen';
import { derivePlayerView } from './derived-player-view';

export function SummonScreen({
  player,
  back,
  summon,
  busy,
  result,
}: {
  player: PlayerBootstrap;
  back: () => void;
  summon: () => Promise<SummonResult | null> | void;
  busy: boolean;
  result: SummonResult | null;
}) {
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'revealed' | 'error'>('idle');
  const [localResult, setLocalResult] = useState<SummonResult | null>(result);
  const revealHeading = useRef<HTMLHeadingElement>(null);
  const view = derivePlayerView(player);
  const canAfford = view.affordableSummons > 0;

  const pull = async () => {
    setPhase('requesting');
    const outcome = await summon();
    if (!outcome) return setPhase('error');
    setLocalResult(outcome);
    setPhase('revealed');
    queueMicrotask(() => revealHeading.current?.focus());
  };

  return (
    <section className="persistent-content summon-screen">
      <ScreenHeading title={player.banner.displayName} subtitle="Capsule tower" back={back} />
      <div className={`capsule-stage phase-${phase} rarity-${localResult?.heroRarity ?? 'common'}`}>
        <div className="summon-burst" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="capsule-machine" aria-hidden="true">
          <span className="machine-dome">
            <i />
          </span>
          <span className="machine-body">
            <i />
          </span>
        </div>
        <div className="summon-copy">
          <span className="pull-count">{view.affordableSummons} pulls available</span>
          {!localResult && <h2>Who is hiding inside?</h2>}
          <p>Epic-or-better guaranteed by pull {player.banner.pityThreshold}.</p>
          <div
            className="pity-track"
            role="progressbar"
            aria-label="Epic guarantee progress"
            aria-valuemin={0}
            aria-valuemax={player.banner.pityThreshold}
            aria-valuenow={localResult?.pityAfter ?? player.banner.pullsSinceEpic}
          >
            <span style={{ width: `${view.pityPercent}%` }} />
          </div>
          <p>
            {player.banner.pullsSinceEpic} / {player.banner.pityThreshold} until guarantee
          </p>
          {localResult && (
            <div className="summon-reveal" role="status" aria-live="polite">
              <span className="rarity-seal">{localResult.heroRarity}</span>
              <h2 ref={revealHeading} tabIndex={-1}>
                {localResult.heroDisplayName}
              </h2>
              <p>
                {localResult.outcomeType === 'duplicate'
                  ? `Duplicate · +${localResult.shardsAwarded} shards`
                  : 'New hero · Joined your collection'}
              </p>
              <small>
                {localResult.gemBalance} gems left · Pity {localResult.pityAfter} /{' '}
                {player.banner.pityThreshold}
              </small>
            </div>
          )}
          <button
            className="plastic-button summon-button"
            aria-label={`Summon for ${player.banner.gemCost} gems`}
            disabled={busy || phase === 'requesting' || !canAfford}
            onClick={() => void pull()}
          >
            <AdventureIcon name="gem" />
            {phase === 'requesting'
              ? 'The tower is choosing…'
              : `Summon · ${player.banner.gemCost}`}
          </button>
          {phase === 'error' && (
            <p className="persistent-error" role="alert">
              The capsule fizzled. Your gems are safe—try again.
            </p>
          )}
          {!canAfford && <p className="persistent-error">You need more gems.</p>}
        </div>
      </div>
    </section>
  );
}
