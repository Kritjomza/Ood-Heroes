import { ONLINE_COPY } from './copy';

export function RespawnOverlay({ seconds }: { seconds: number }) {
  if (seconds <= 0) return null;
  return (
    <div className="online-respawn" role="dialog" aria-modal="true" aria-label="Team respawn">
      <span className="flattened-team" aria-hidden="true">
        x_x x_x x_x
      </span>
      <strong>{ONLINE_COPY.wipeTitle}</strong>
      <span>Respawning in {seconds}...</span>
    </div>
  );
}
