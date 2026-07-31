import type { AfkClaimPreview } from '@odd-tower/network-protocol';

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
    <div className="modal-scrim" role="presentation">
      <section
        className="sticker-card afk-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="afk-title"
      >
        <span className="afk-chest" aria-hidden="true">
          🎁
        </span>
        <h2 id="afk-title">While you were away…</h2>
        <p>{claim.intervalCount} complete half-hour intervals</p>
        <ul>
          <li>🪙 {claim.gold} Gold</li>
          <li>🫧 {claim.upgradeJelly} Upgrade Jelly</li>
          <li>⭐ {claim.heroExperience} EXP per active Hero</li>
        </ul>
        <button autoFocus className="primary-action" disabled={busy} onClick={collect}>
          {busy ? 'Saving…' : 'Collect Rewards'}
        </button>
        <button className="text-action" onClick={close}>
          Later
        </button>
      </section>
    </div>
  );
}
