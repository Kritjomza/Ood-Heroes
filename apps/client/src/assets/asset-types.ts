export type AssetKind = 'hero' | 'currency' | 'ui' | 'summon' | 'afk' | 'monster' | 'map' | 'vfx';
export type AssetEntry = {
  id: string;
  kind: AssetKind;
  label: string;
  mock: 'css-hero' | 'glyph';
  replacementPath: string;
  fallback: string;
};
