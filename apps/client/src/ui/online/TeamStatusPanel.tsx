import type { CombatHeroUiState } from '../../game/multiplayer/MultiplayerBridge';

const ROLE_FACE = { fighter: '•ᴗ•', tank: '•̀ᴗ•́', support: '◕‿◕' } as const;

export function TeamStatusPanel({ heroes }: { heroes: CombatHeroUiState[] }) {
  return (
    <section className="team-status-panel cartoon-panel" aria-label="Team status">
      <h2>Snack Squad</h2>
      {heroes.map((hero) => {
        const defeated = hero.status === 'defeated';
        const status = defeated
          ? 'Defeated'
          : hero.status === 'reviving'
            ? 'Reviving'
            : hero.slowed
              ? 'Slowed'
              : 'Ready';
        return (
          <div className={`combat-hero role-${hero.role} status-${hero.status}`} key={hero.id}>
            <span className="hero-face" aria-hidden="true">
              {defeated ? '×﹏×' : ROLE_FACE[hero.role]}
            </span>
            <div className="hero-details">
              <b>
                {hero.role} · Session Level {hero.level}
              </b>
              <span className="hero-state">{status}</span>
              <progress value={hero.currentHp} max={hero.maxHp} aria-label={`${hero.role} HP`} />
              <span>
                HP {Math.round(hero.currentHp)} / {hero.maxHp} · Session EXP {hero.experience} /{' '}
                {hero.nextExperience}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
