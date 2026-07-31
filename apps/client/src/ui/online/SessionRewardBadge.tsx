export function SessionRewardBadge({ gold, focus }: { gold: number; focus: string }) {
  return (
    <section className="session-reward-badge cartoon-panel" aria-label="Temporary session rewards">
      <strong>Session Gold: {gold}</strong>
      <span>Target: {focus || 'None'}</span>
    </section>
  );
}
