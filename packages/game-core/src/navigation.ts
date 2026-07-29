import type { Grid, GridPoint } from './types';
const key = (p: GridPoint) => `${p.x},${p.y}`;
export function findPath(grid: Grid, start: GridPoint, goal: GridPoint): GridPoint[] | null {
  if (!grid.isWalkable(start.x, start.y) || !grid.isWalkable(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [start];
  const open = [start],
    came = new Map<string, GridPoint>(),
    g = new Map([[key(start), 0]]),
    closed = new Set<string>();
  while (open.length) {
    open.sort((a, b) => {
      const fa = (g.get(key(a)) ?? Infinity) + Math.abs(a.x - goal.x) + Math.abs(a.y - goal.y),
        fb = (g.get(key(b)) ?? Infinity) + Math.abs(b.x - goal.x) + Math.abs(b.y - goal.y);
      return fa - fb || a.y - b.y || a.x - b.x;
    });
    const cur = open.shift()!;
    if (cur.x === goal.x && cur.y === goal.y) {
      const path = [cur];
      let k = key(cur);
      while (came.has(k)) {
        const p = came.get(k)!;
        path.push(p);
        k = key(p);
      }
      return path.reverse();
    }
    closed.add(key(cur));
    for (const n of [
      { x: cur.x, y: cur.y - 1 },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x + 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
    ]) {
      const nk = key(n);
      if (
        n.x < 0 ||
        n.y < 0 ||
        n.x >= grid.width ||
        n.y >= grid.height ||
        !grid.isWalkable(n.x, n.y) ||
        closed.has(nk)
      )
        continue;
      const score = (g.get(key(cur)) ?? 0) + 1;
      if (score < (g.get(nk) ?? Infinity)) {
        came.set(nk, cur);
        g.set(nk, score);
        if (!open.some((p) => key(p) === nk)) open.push(n);
      }
    }
  }
  return null;
}
