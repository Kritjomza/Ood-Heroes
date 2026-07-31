import { assetRegistry } from './asset-registry';

export const resolveAsset = (id: string) => assetRegistry.resolve(id);
