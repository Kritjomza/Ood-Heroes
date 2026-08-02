import type { PersistenceStatus as Status } from '@odd-tower/network-protocol';

export function PersistenceStatus({
  status,
  queueDepth = 0,
}: {
  status: Status;
  queueDepth?: number;
}) {
  if (status === 'healthy')
    return (
      <span className="save-status healthy" role="status">
        Saved
      </span>
    );
  return (
    <span className={`save-status ${status}`} role="status">
      Save paused
      {queueDepth ? ` · ${queueDepth} ${queueDepth === 1 ? 'change' : 'changes'} waiting` : ''}
    </span>
  );
}
