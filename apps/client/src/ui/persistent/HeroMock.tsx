import { resolveAsset } from '../../assets/asset-resolver';

export function HeroMock({
  assetId,
  size = 'normal',
}: {
  assetId: string;
  size?: 'small' | 'normal';
}) {
  const asset = resolveAsset(assetId);
  return (
    <span className={`hero-mock hero-mock-${size}`} role="img" aria-label={asset.label}>
      {asset.replacementPath ? (
        <img src={asset.replacementPath} alt="" aria-hidden="true" />
      ) : (
        <span className="missing-hero-art" aria-hidden="true">
          ?
        </span>
      )}
    </span>
  );
}
