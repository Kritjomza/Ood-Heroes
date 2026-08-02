import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { AdventureIcon } from './AdventureIcons';
import { PersistenceStatus } from './PersistenceStatus';

export function PlayerStrip({ player }: { player: PlayerBootstrap }) {
  return (
    <header className="player-strip">
      <div className="player-badge">
        <span className="player-avatar" aria-hidden="true">
          O
        </span>
        <span>
          <small>Adventurer</small>
          <strong>{player.profile.displayName}</strong>
        </span>
      </div>
      <div className="player-currencies" aria-label="Currencies">
        <span>
          <AdventureIcon name="gold" />
          {player.currencies.gold.toLocaleString()}
        </span>
        <span>
          <AdventureIcon name="gem" />
          {player.currencies.gem.toLocaleString()}
        </span>
        <span>
          <AdventureIcon name="jelly" />
          {player.currencies.upgradeJelly.toLocaleString()}
        </span>
      </div>
      <PersistenceStatus
        status={player.persistence.status}
        queueDepth={player.persistence.queueDepth}
      />
    </header>
  );
}
