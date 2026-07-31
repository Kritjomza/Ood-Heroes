import type { AutoHuntState } from '@odd-tower/network-protocol';
import { AUTO_HUNT_COPY } from './copy';

export function CombatStatusBubble({ state }: { state: AutoHuntState }) {
  const copy = AUTO_HUNT_COPY[state];
  return (
    <div
      className={`combat-status-bubble state-${state}`}
      role="status"
      aria-label="Combat status"
      aria-live="polite"
    >
      <span aria-hidden="true">{copy.icon}</span>
      <strong>{copy.status}</strong>
    </div>
  );
}
