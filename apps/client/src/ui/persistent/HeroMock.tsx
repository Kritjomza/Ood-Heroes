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
      <span aria-hidden="true">{asset.fallback}</span>
    </span>
  );
}
