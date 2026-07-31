import { NETWORK_CONFIG } from '@odd-tower/network-protocol';

export class CombatEventDeduplicator {
  private readonly ids = new Set<string>();
  get size() {
    return this.ids.size;
  }
  accept(id: string) {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    while (this.ids.size > NETWORK_CONFIG.maxClientEventIds)
      this.ids.delete(this.ids.values().next().value!);
    return true;
  }
  clear() {
    this.ids.clear();
  }
}
