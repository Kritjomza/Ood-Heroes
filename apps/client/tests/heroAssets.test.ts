import { describe, expect, it } from 'vitest';
import { heroImageForSlug } from '../src/assets/hero-assets';

describe('final hero image mapping', () => {
  it.each([
    ['grilled_chicken', 'hero_grilled_chicken/left_hero_grilled_chicken.webp'],
    ['pink_chocolate_lizard', 'hero_pink_chocolate_lizard/left_hero_pink_chocolate_lizard.webp'],
    ['robot_jelly', 'hero_jelly_robot/left_hero_jelly_robot.webp'],
    ['tofu_rabbit', 'hero_tofu_rabbit/left_hero_tofu_rabbit.webp'],
    ['accountant_octopus', 'hero_accountant_octopus/left_hero_accountant_octopus.webp'],
    ['samurai_bread', 'hero_samurai_bread/left_hero_samurai_bread.webp'],
  ])('uses the bundled PNG for %s', (slug, expectedPath) => {
    expect(heroImageForSlug(slug)).toMatch(expectedPath);
  });

  it('does not map an unknown hero to another character', () => {
    expect(heroImageForSlug('unknown')).toBeNull();
  });
});
