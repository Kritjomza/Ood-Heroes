import type { PlayerBootstrap } from '@odd-tower/network-protocol';

export function HomeScreen({
  player,
  navigate,
  onPlayLocal,
  onPlayOnline,
}: {
  player: PlayerBootstrap;
  navigate: (screen: string) => void;
  onPlayLocal: () => void;
  onPlayOnline: () => void;
}) {
  return (
    <section className="persistent-content home-screen">
      <header className="persistent-topbar">
        <div>
          <p className="persistent-eyebrow">Welcome back</p>
          <h1>{player.profile.displayName}</h1>
        </div>
        <div className="currency-row" aria-label="Currencies">
          <span>🪙 {player.currencies.gold}</span>
          <span>💎 {player.currencies.gem}</span>
          <span>🫧 {player.currencies.upgradeJelly}</span>
        </div>
      </header>
      <div className="home-hero sticker-card">
        <span className="tower-large" aria-hidden="true">
          🏰
        </span>
        <div>
          <h2>Floor 1 is waiting</h2>
          <p>Your saved team is ready for another strange climb.</p>
        </div>
        <button className="primary-action" onClick={onPlayOnline}>
          Enter Floor 1
        </button>
      </div>
      <nav className="feature-grid" aria-label="Player features">
        <button onClick={() => navigate('collection')}>
          <span>🧺</span>
          <strong>Collection</strong>
          <small>{player.heroes.length}/6 Heroes</small>
        </button>
        <button onClick={() => navigate('summon')}>
          <span>✨</span>
          <strong>Summon</strong>
          <small>{player.banner.pullsSinceEpic}/20 pity</small>
        </button>
        <button onClick={() => navigate('team')}>
          <span>🛡️</span>
          <strong>Team</strong>
          <small>
            {player.activeTeam.slots.length}/{player.profile.teamSlots} slots
          </small>
        </button>
        <button onClick={() => navigate('account')}>
          <span>👤</span>
          <strong>Account</strong>
          <small>{player.profile.accountKind === 'guest' ? 'Protect progress' : 'Protected'}</small>
        </button>
      </nav>
      <button className="text-action" onClick={onPlayLocal}>
        Play Local Prototype
      </button>
    </section>
  );
}
