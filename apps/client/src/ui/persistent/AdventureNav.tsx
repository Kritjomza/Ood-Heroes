import { AdventureIcon, type AdventureIconName } from './AdventureIcons';

export type PrimaryScreen = 'home' | 'collection' | 'summon' | 'team' | 'account';
const tabs: Array<{ id: PrimaryScreen; label: string; icon: AdventureIconName }> = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'collection', label: 'Heroes', icon: 'heroes' },
  { id: 'summon', label: 'Summon', icon: 'summon' },
  { id: 'team', label: 'Team', icon: 'team' },
  { id: 'account', label: 'Account', icon: 'account' },
];

export function AdventureNav({
  active,
  onSelect,
}: {
  active: PrimaryScreen;
  onSelect: (screen: PrimaryScreen) => void;
}) {
  return (
    <nav className="adventure-nav" aria-label="Adventure">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`adventure-tab tab-${tab.id}`}
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          <AdventureIcon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
