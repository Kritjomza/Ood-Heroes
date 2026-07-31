import type { AutoHuntState } from '@odd-tower/network-protocol';
import { AUTO_HUNT_COPY } from './copy';

export function AutoHuntButton({
  enabled,
  state,
  onToggle,
}: {
  enabled: boolean;
  state: AutoHuntState;
  onToggle: () => void;
}) {
  const copy = AUTO_HUNT_COPY[state];
  return (
    <button
      className={`auto-hunt-online state-${state} ${enabled ? 'active' : ''}`}
      aria-label="Auto Hunt"
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <span aria-hidden="true">{copy.icon}</span>
      <b>{copy.button}</b>
    </button>
  );
}
