import { access, readdir, readFile } from 'node:fs/promises';

const heroFiles = (await readdir('art-prompts/heroes')).filter((name) => name.endsWith('.md'));
const monsterFiles = (await readdir('art-prompts/monsters')).filter((name) => name.endsWith('.md'));
const vfxFiles = (await readdir('art-prompts/vfx')).filter((name) => name.endsWith('.md'));
if (heroFiles.length !== 6) throw new Error(`Expected 6 hero prompt files, received ${heroFiles.length}.`);
if (monsterFiles.length !== 5) throw new Error(`Expected 5 monster prompt files, received ${monsterFiles.length}.`);
if (vfxFiles.length !== 1 || vfxFiles[0] !== 'floor_1_vfx.md')
  throw new Error('Expected exactly art-prompts/vfx/floor_1_vfx.md.');

const flow = await readFile('art-prompts/15_single_sprite_world_manifest.md', 'utf8');
const rows = flow
  .split(/\r?\n/u)
  .filter(
    (line) =>
      line.startsWith('| ') &&
      !line.startsWith('| ---') &&
      !line.startsWith('| intake filename'),
  );
const filenames = rows.map((row) => row.split('|')[1]!.trim());
if (new Set(filenames).size !== filenames.length)
  throw new Error('Duplicate single-sprite intake filename.');
const count = (needle: string) => rows.filter((row) => row.includes(`| ${needle} |`)).length;
const counts = [count('hero_world'), count('monster_world'), count('boss_world'), count('add_world'), count('npc_world')];
if (counts.join('/') !== '6/5/1/2/3')
  throw new Error(`Expected active world counts 6/5/1/2/3, received ${counts.join('/')}.`);
if (rows.some((row) => !row.includes('/world.webp |')))
  throw new Error('Every active world row must target one world.webp image.');

const manifest = JSON.parse(
  await readFile('docs/assets/phase-4-asset-manifest.json', 'utf8'),
) as { assets: Array<{ assetId: string; priority: string }> };
const priorities = ['P0', 'P1', 'P2'].map(
  (priority) => manifest.assets.filter((asset) => asset.priority === priority).length,
);
if (manifest.assets.length !== 75 || priorities.join('/') !== '39/17/19')
  throw new Error(`Manifest totals are ${manifest.assets.length}/${priorities.join('/')}.`);
if (manifest.assets.some((asset) => /\.sprite_/u.test(asset.assetId)))
  throw new Error('Obsolete hero sprite ID remains in active manifest.');

const heroText = await Promise.all(
  heroFiles.map((name) => readFile(`art-prompts/heroes/${name}`, 'utf8')),
);
for (const [index, text] of heroText.entries()) {
  const sources = text.match(/hero_[a-z_]+_world\.webp/gu) ?? [];
  if (new Set(sources).size !== 1)
    throw new Error(`Hero owner ${heroFiles[index]} does not define exactly one active world source.`);
  if (!text.includes('one right-facing transparent world image'))
    throw new Error(`Hero owner ${heroFiles[index]} does not declare the active orientation.`);
}

const monsterText = await Promise.all(
  monsterFiles.map((name) => readFile(`art-prompts/monsters/${name}`, 'utf8')),
);
for (const [index, text] of monsterText.entries()) {
  const sources = text.match(/monster_[a-z_]+_world\.webp/gu) ?? [];
  if (new Set(sources).size !== 1)
    throw new Error(`Monster owner ${monsterFiles[index]} does not define exactly one active world source.`);
}

const boss = await readFile('art-prompts/bosses/boss_angry_refrigerator.md', 'utf8');
const adds = await readFile('art-prompts/bosses/boss_frozen_food_minions.md', 'utf8');
const npcs = await readFile('art-prompts/npcs/floor_1_moving_npcs.md', 'utf8');
if (!boss.includes('boss_angry_refrigerator_world.webp')) throw new Error('Missing boss world prompt.');
if ((adds.match(/add_frozen_food_[a-z_]+_world\.webp/gu) ?? []).length !== 2)
  throw new Error('Missing frozen-food add world prompts.');
if ((npcs.match(/npc_[a-z_]+_world\.webp/gu) ?? []).length !== 3)
  throw new Error('Missing Floor 1 NPC world prompts.');

for (const obsolete of [
  '02_hero_master_designs.md',
  '03_hero_animation_prompts.md',
  '04_monster_prompts.md',
  '08_vfx_prompts.md',
]) {
  try {
    await access(`art-prompts/${obsolete}`);
    throw new Error(`Obsolete prompt index still exists: ${obsolete}.`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Obsolete prompt index')) throw error;
  }
}

console.log(
  'Validated prompt library: active single-sprite world sources 6 heroes, 5 monsters, 1 boss, 2 adds, 3 NPCs; manifest 75/39/17/19.',
);
