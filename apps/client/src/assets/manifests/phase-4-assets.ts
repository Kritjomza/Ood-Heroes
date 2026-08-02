import type { AssetEntry } from '../asset-types';
import { heroImageForSlug } from '../hero-assets';

const heroes = [
  ['grilled_chicken', 'Grilled Chicken Executioner', '🍗'],
  ['pink_chocolate_lizard', 'Pink Chocolate-Dipped Lizard', '🦎'],
  ['robot_jelly', 'Robot Jelly', '🤖'],
  ['tofu_rabbit', 'Tofu Foam Rabbit', '🐰'],
  ['accountant_octopus', 'Accountant Octopus', '🐙'],
  ['samurai_bread', 'Samurai Bread', '🍞'],
] as const;
const heroAssets = heroes.flatMap(([slug, label, fallback]) => {
  const base = `hero.${slug}`;
  return [
    entry(`${base}.portrait`, 'hero', `${label} portrait`, fallback),
    entry(`${base}.icon`, 'hero', `${label} icon`, fallback),
    entry(`${base}.collection_card`, 'hero', `${label} collection card`, fallback),
    entry(`${base}.world`, 'hero', `${label} world image`, fallback),
    entry(`${base}.silhouette`, 'hero', `${label} silhouette`, '●'),
  ];
});

const supportingAssets: Array<[string, AssetEntry['kind'], string, string]> = [
  ['ui.rarity.common_frame', 'ui', 'Common rarity frame', '○'],
  ['ui.rarity.rare_frame', 'ui', 'Rare rarity frame', '◇'],
  ['ui.rarity.epic_frame', 'ui', 'Epic rarity frame', '✦'],
  ['ui.rarity.legendary_frame', 'ui', 'Legendary rarity frame', '★'],
  ['item.gold', 'currency', 'Gold', '🪙'],
  ['item.gem', 'currency', 'Gem', '💎'],
  ['item.upgrade_jelly', 'currency', 'Upgrade Jelly', '🫧'],
  ['item.hero_shard', 'currency', 'Hero Shard', '◆'],
  ['ui.summon.shrine', 'summon', 'Summon shrine', '⛩️'],
  ['ui.summon.capsule', 'summon', 'Summon capsule', '🔮'],
  ['ui.summon.reveal_glow', 'vfx', 'Summon reveal glow', '✨'],
  ['ui.summon.new_badge', 'summon', 'New Hero badge', 'NEW'],
  ['ui.summon.duplicate_badge', 'summon', 'Duplicate badge', 'DUP'],
  ['ui.team.slot_empty', 'ui', 'Empty team slot', '+'],
  ['ui.team.slot_locked', 'ui', 'Locked team slot', '🔒'],
  ['ui.team.slot_selected', 'ui', 'Selected team slot', '✓'],
  ['ui.team.slot_add', 'ui', 'Add team member', '+'],
  ['ui.afk.chest_closed', 'afk', 'Closed AFK chest', '🎁'],
  ['ui.afk.chest_open', 'afk', 'Open AFK chest', '🎊'],
  ['ui.afk.sleeping_helper', 'afk', 'Sleeping helper', '💤'],
  ['ui.afk.clock', 'afk', 'AFK clock', '⏰'],
  ['ui.auth.tower', 'ui', 'Auth tower', '🏰'],
  ['ui.auth.hero_group', 'ui', 'Auth Hero group', '👥'],
  ['ui.home.camp_background', 'ui', 'Home camp', '⛺'],
  ['ui.home.tower_button', 'ui', 'Tower entrance', '🏰'],
  ['ui.icon.close', 'ui', 'Close', '×'],
  ['ui.icon.back', 'ui', 'Back', '←'],
  ['ui.icon.settings', 'ui', 'Settings', '⚙'],
  ['ui.icon.info', 'ui', 'Information', 'i'],
  ['ui.icon.lock', 'ui', 'Lock', '🔒'],
  ['ui.icon.check', 'ui', 'Success', '✓'],
  ['ui.icon.error', 'ui', 'Error', '!'],
  ['ui.icon.warning', 'ui', 'Warning', '⚠'],
  ['ui.icon.account', 'ui', 'Account', '👤'],
  ['monster.grumpy_radish', 'monster', 'Grumpy Radish', '🌱'],
  ['monster.jumping_sauce_bag', 'monster', 'Jumping Sauce Bag', '🛍️'],
  ['monster.shoe_biting_dust_ball', 'monster', 'Shoe-Biting Dust Ball', '🧶'],
  ['monster.wild_sausage', 'monster', 'Wild Sausage', '🌭'],
  ['monster.lost_pudding', 'monster', 'Lost Pudding', '🍮'],
  ['map.floor_1.tiles', 'map', 'Floor 1 tiles', '▦'],
  ['map.floor_1.background', 'map', 'Floor 1 background', '▧'],
  ['vfx.attack_hit', 'vfx', 'Attack impact', '✹'],
  ['vfx.heal', 'vfx', 'Healing burst', '✚'],
  ['vfx.movement_slow', 'vfx', 'Movement slow', '❄'],
  ['vfx.charge_warning', 'vfx', 'Charge warning', '⚠'],
];

export const PHASE_4_ASSETS: AssetEntry[] = [
  ...heroAssets,
  ...supportingAssets.map(([id, kind, label, fallback]) => entry(id, kind, label, fallback)),
];

function entry(id: string, kind: AssetEntry['kind'], label: string, fallback: string): AssetEntry {
  const heroSlug = id.startsWith('hero.')
    ? id.split('.')[1]
    : null;
  const monsterSlug = kind === 'monster' ? id.slice('monster.'.length) : null;
  return {
    id,
    kind,
    label,
    mock: kind === 'hero' ? 'css-hero' : 'glyph',
    replacementPath: heroSlug
      ? heroImageForSlug(heroSlug) ?? ''
      : monsterSlug
        ? `/assets/game/monsters/${monsterSlug}/world.webp`
        : `/assets/final/${id.replaceAll('.', '/')}.webp`,
    fallback,
  };
}
