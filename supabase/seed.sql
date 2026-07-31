insert into public.hero_definitions (
  id,
  slug,
  display_name,
  role,
  rarity,
  base_hp,
  base_attack,
  base_defense,
  move_speed,
  attack_range,
  attack_cooldown_ms,
  summon_weight,
  duplicate_shards,
  starter_eligible,
  asset_key,
  enabled,
  sort_order
)
values
  (
    'hero_001_grilled_chicken', 'grilled_chicken', 'Grilled Chicken Executioner',
    'fighter', 'common', 110, 18, 4, 120, 52, 800, 2750, 10, true,
    'hero.grilled_chicken.portrait', true, 1
  ),
  (
    'hero_002_pink_chocolate_lizard', 'pink_chocolate_lizard',
    'Pink Chocolate-Dipped Lizard', 'trickster', 'rare', 95, 17, 3, 132, 58, 700,
    1500, 15, false, 'hero.pink_chocolate_lizard.portrait', true, 2
  ),
  (
    'hero_003_robot_jelly', 'robot_jelly', 'Robot Jelly', 'tank', 'common',
    155, 11, 8, 112, 48, 1000, 2750, 10, true, 'hero.robot_jelly.portrait', true, 3
  ),
  (
    'hero_004_tofu_rabbit', 'tofu_rabbit', 'Tofu Foam Rabbit', 'healer', 'rare',
    90, 13, 3, 116, 90, 1100, 1500, 15, true, 'hero.tofu_rabbit.portrait', true, 4
  ),
  (
    'hero_005_accountant_octopus', 'accountant_octopus', 'Accountant Octopus',
    'support', 'epic', 105, 12, 5, 114, 105, 1000, 1200, 30, false,
    'hero.accountant_octopus.portrait', true, 5
  ),
  (
    'hero_006_samurai_bread', 'samurai_bread', 'Samurai Bread', 'ranger',
    'legendary', 100, 22, 4, 118, 150, 1200, 300, 60, false,
    'hero.samurai_bread.portrait', true, 6
  )
on conflict (id) do update set
  slug = excluded.slug,
  display_name = excluded.display_name,
  role = excluded.role,
  rarity = excluded.rarity,
  base_hp = excluded.base_hp,
  base_attack = excluded.base_attack,
  base_defense = excluded.base_defense,
  move_speed = excluded.move_speed,
  attack_range = excluded.attack_range,
  attack_cooldown_ms = excluded.attack_cooldown_ms,
  summon_weight = excluded.summon_weight,
  duplicate_shards = excluded.duplicate_shards,
  starter_eligible = excluded.starter_eligible,
  asset_key = excluded.asset_key,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

insert into public.summon_banners (
  id, display_name, gem_cost, pity_threshold, enabled
)
values ('standard_odd_heroes', 'Odd Hero Summon', 100, 20, true)
on conflict (id) do update set
  display_name = excluded.display_name,
  gem_cost = excluded.gem_cost,
  pity_threshold = excluded.pity_threshold,
  enabled = excluded.enabled;

insert into public.summon_pool_entries (banner_id, hero_definition_id, weight)
select 'standard_odd_heroes', id, summon_weight
from public.hero_definitions
where enabled
on conflict (banner_id, hero_definition_id) do update set
  weight = excluded.weight;
