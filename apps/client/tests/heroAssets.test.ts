import { describe, expect, it } from 'vitest';
import { heroImageForSlug } from '../src/assets/hero-assets';

describe('final hero image mapping', () => {
  it.each([
    ['grilled_chicken', 'hero_grilled_chicken/left_hero_grilled_chicken.png'],
    ['pink_chocolate_lizard', 'hero_pink_chocolate_lizard/left_hero_pink_chocolate_lizard.png'],
    ['robot_jelly', 'hero_jelly_robot/left_hero_jelly_robot.png'],
    ['tofu_rabbit', 'hero_tofu_rabbit/left_hero_tofu_rabbit.png'],
    ['accountant_octopus', 'hero_accountant_octopus/left_hero_accountant_octopus.png'],
    ['samurai_bread', 'hero_samurai_bread/left_hero_samurai_bread.png'],
  ])('uses the bundled PNG for %s', (slug, expectedPath) => {
    expect(heroImageForSlug(slug)).toMatch(expectedPath);
  });

  it('does not map an unknown hero to another character', () => {
    expect(heroImageForSlug('unknown')).toBeNull();
  });
});
