import type { PersistenceStatus as Status } from '@odd-tower/network-protocol';

export function PersistenceStatus({ status }: { status: Status }) {
  if (status === 'healthy') return <span className="save-status healthy">● Saved</span>;
  return (
    <span className={`save-status ${status}`} role="status">
      ● Saving paused
    </span>
  );
}
