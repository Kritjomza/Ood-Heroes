import type { CombatHeroUiState } from '../../game/multiplayer/MultiplayerBridge';
import { worldVisualFor } from '../../assets/world-visuals';

export function TeamStatusPanel({ heroes }: { heroes: CombatHeroUiState[] }) {
  if (heroes.length === 0) return null;
  return (
    <section className="team-status-panel cartoon-panel" aria-label="Team status">
      <header><h2>Snack Squad</h2><span>{heroes.filter((hero) => hero.status !== 'defeated').length}/{heroes.length} ready</span></header>
      <div className="snack-squad-roster">
        {heroes.map((hero) => {
          const defeated = hero.status === 'defeated';
          const status = defeated ? 'Defeated' : hero.status === 'reviving' ? 'Reviving' : hero.slowed ? 'Slowed' : 'Ready';
          const artwork = worldVisualFor(hero.definitionId)?.sourcePath;
          return (
            <article className={`combat-hero role-${hero.role} status-${hero.status}`} key={hero.id}>
              <span className="hero-face" role="img" aria-label={`${hero.role} character${defeated ? ', defeated' : ''}`}>
                {artwork ? <img src={artwork} alt="" aria-hidden="true" /> : <b aria-hidden="true">?</b>}
              </span>
              <div className="hero-details">
                <div><b>{hero.role}</b><span className="hero-level">Lv {hero.level}</span><span className="hero-state">{status}</span></div>
                <progress value={hero.currentHp} max={hero.maxHp} aria-label={`${hero.role} HP`} />
                <small>HP {Math.round(hero.currentHp)}/{hero.maxHp} · Session Level {hero.level} · EXP {hero.experience}/{hero.nextExperience}</small>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
