import { useEffect, useState } from 'react';
import { resolveAsset } from '../../assets/asset-resolver';

export function HeroMock({
  assetId,
  size = 'normal',
}: {
  assetId: string;
  size?: 'small' | 'normal';
}) {
  const asset = resolveAsset(assetId);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [asset.replacementPath]);
  return (
    <span
      className={`hero-mock hero-mock-${size}${failed ? ' hero-art-failed' : ''}`}
      role="img"
      aria-label={failed ? `${asset.label}, artwork unavailable` : asset.label}
    >
      {asset.replacementPath && !failed ? (
        <img
          src={asset.replacementPath}
          alt=""
          aria-hidden="true"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="missing-hero-art" aria-hidden="true">
          <span className="fallback-face">?</span>
          <small>Oddity incoming</small>
        </span>
      )}
    </span>
  );
}
