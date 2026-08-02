import { useState } from 'react';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { ScreenHeading } from './CollectionScreen';
import { derivePlayerView } from './derived-player-view';

export type SummonUiResult = { outcomeType: 'new' | 'duplicate'; message: string };
export function SummonScreen({
  player,
  back,
  summon,
  busy,
  result,
}: {
  player: PlayerBootstrap;
  back: () => void;
  summon: () => Promise<SummonUiResult | null> | void;
  busy: boolean;
  result: string | null;
}) {
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'arrived'>('idle');
  const [localResult, setLocalResult] = useState<string | null>(null);
  const view = derivePlayerView(player);
  const canAfford = view.affordableSummons > 0;
  const pull = async () => {
    setPhase('requesting');
    const outcome = await summon();
    if (outcome) {
      setLocalResult(outcome.message);
      setPhase('arrived');
    } else setPhase('idle');
  };
  return (
    <section className="persistent-content summon-screen">
      <ScreenHeading title={player.banner.displayName} subtitle="Capsule tower" back={back} />
      <div className={`capsule-stage phase-${phase}`}>
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
          <h2>Who is hiding inside?</h2>
          <p>Epic-or-better guaranteed by pull {player.banner.pityThreshold}.</p>
          <div
            className="pity-track"
            role="progressbar"
            aria-label="Epic guarantee progress"
            aria-valuemin={0}
            aria-valuemax={player.banner.pityThreshold}
            aria-valuenow={player.banner.pullsSinceEpic}
          >
            <span style={{ width: `${view.pityPercent}%` }} />
          </div>
          <p>
            {player.banner.pullsSinceEpic} / {player.banner.pityThreshold} until guarantee
          </p>
          {(localResult ?? result) && (
            <p className="summon-result" role="status">
              {localResult ?? result}
            </p>
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
          {!canAfford && <p className="persistent-error">You need more gems.</p>}
        </div>
      </div>
    </section>
  );
}
