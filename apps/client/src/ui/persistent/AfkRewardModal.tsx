import type { AfkClaimPreview } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';

export function AfkRewardModal({
  claim,
  busy,
  close,
  collect,
}: {
  claim: NonNullable<AfkClaimPreview>;
  busy: boolean;
  close: () => void;
  collect: () => void;
}) {
  return (
    <div className="modal-scrim parcel-scrim" role="presentation">
      <section className="afk-parcel" role="dialog" aria-modal="true" aria-labelledby="afk-title">
        <span className="parcel-tab" aria-hidden="true">
          PULL
        </span>
        <div className="parcel-mark" aria-hidden="true">
          <AdventureIcon name="home" />
        </div>
        <h2 id="afk-title">While you were away</h2>
        <p>Your team explored for {claim.rewardedMinutes} rewarded minutes.</p>
        {claim.rewardedMinutes === 30 && <p className="afk-cap-note">30-minute maximum reached.</p>}
        <ul className="reward-list">
          <li>
            <AdventureIcon name="gold" />
            <span>
              <strong>{claim.gold.toLocaleString()} Gold</strong>
              <small>Adventure treasure</small>
            </span>
          </li>
          <li>
            <AdventureIcon name="gem" />
            <span>
              <strong>{claim.diamonds.toLocaleString()} Diamonds</strong>
              <small>For new summons</small>
            </span>
          </li>
          <li>
            <AdventureIcon name="star" />
            <span>
              <strong>{claim.shardsPerActiveHero.toLocaleString()} Shards per active hero</strong>
              <small>Shared with your current party</small>
            </span>
          </li>
        </ul>
        <button
          autoFocus
          className="plastic-button collect-rewards"
          disabled={busy}
          onClick={collect}
        >
          {busy ? 'Saving rewards…' : 'Collect rewards'}
        </button>
        <button className="text-action" onClick={close}>
          Leave sealed
        </button>
      </section>
    </div>
  );
}
