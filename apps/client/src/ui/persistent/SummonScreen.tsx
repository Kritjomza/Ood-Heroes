import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { ScreenHeading } from './CollectionScreen';

export function SummonScreen({
  player,
  back,
  summon,
  busy,
  result,
}: {
  player: PlayerBootstrap;
  back: () => void;
  summon: () => void;
  busy: boolean;
  result: string | null;
}) {
  const canAfford = player.currencies.gem >= player.banner.gemCost;
  return (
    <section className="persistent-content summon-screen">
      <ScreenHeading
        title={player.banner.displayName}
        subtitle="Server-authoritative reveal"
        back={back}
      />
      <div className="summon-stage sticker-card">
        <div className="summon-spark" aria-hidden="true">
          ✨
        </div>
        <h2>Who is hiding in the tower?</h2>
        <p>Epic-or-better guaranteed by pull {player.banner.pityThreshold}.</p>
        <div className="pity-meter">
          <span
            style={{
              width: `${(player.banner.pullsSinceEpic / player.banner.pityThreshold) * 100}%`,
            }}
          />
        </div>
        <p>
          {player.banner.pullsSinceEpic} / {player.banner.pityThreshold} pity
        </p>
        {result && (
          <p className="summon-result" role="status">
            {result}
          </p>
        )}
        <button className="primary-action" disabled={busy || !canAfford} onClick={summon}>
          {busy ? 'The tower is choosing…' : `Summon · 💎 ${player.banner.gemCost}`}
        </button>
        {!canAfford && <p className="persistent-error">You need more Gems.</p>}
      </div>
    </section>
  );
}
