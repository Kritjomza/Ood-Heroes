type Positioned = { id: string; x: number; y: number };

export class SpatialGrid<T extends Positioned> {
  private readonly buckets = new Map<string, Map<string, T>>();
  private readonly membership = new Map<string, string>();

  constructor(private readonly cellSize: number) {
    if (!(cellSize > 0)) throw new Error('Spatial cell size must be positive.');
  }

  get size() {
    return this.membership.size;
  }

  get bucketCount() {
    return this.buckets.size;
  }

  upsert(item: T) {
    const nextKey = this.keyAt(item.x, item.y);
    const priorKey = this.membership.get(item.id);
    if (priorKey && priorKey !== nextKey) this.removeFromBucket(priorKey, item.id);
    let bucket = this.buckets.get(nextKey);
    if (!bucket) {
      bucket = new Map();
      this.buckets.set(nextKey, bucket);
    }
    bucket.set(item.id, item);
    this.membership.set(item.id, nextKey);
  }

  remove(id: string) {
    const key = this.membership.get(id);
    if (!key) return false;
    this.membership.delete(id);
    this.removeFromBucket(key, id);
    return true;
  }

  queryRadius(center: { x: number; y: number }, radius: number): T[] {
    const safeRadius = Math.max(0, radius);
    const minX = Math.floor((center.x - safeRadius) / this.cellSize);
    const maxX = Math.floor((center.x + safeRadius) / this.cellSize);
    const minY = Math.floor((center.y - safeRadius) / this.cellSize);
    const maxY = Math.floor((center.y + safeRadius) / this.cellSize);
    const radiusSquared = safeRadius * safeRadius;
    const values: Array<{ item: T; distanceSquared: number }> = [];
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++)
        for (const item of this.buckets.get(`${x},${y}`)?.values() ?? []) {
          const dx = item.x - center.x;
          const dy = item.y - center.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared <= radiusSquared) values.push({ item, distanceSquared });
        }
    values.sort(
      (a, b) => a.distanceSquared - b.distanceSquared || a.item.id.localeCompare(b.item.id),
    );
    return values.map(({ item }) => item);
  }

  clear() {
    this.buckets.clear();
    this.membership.clear();
  }

  private keyAt(x: number, y: number) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  private removeFromBucket(key: string, id: string) {
    const bucket = this.buckets.get(key);
    if (!bucket) return;
    bucket.delete(id);
    if (bucket.size === 0) this.buckets.delete(key);
  }
}
