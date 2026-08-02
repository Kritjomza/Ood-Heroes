import accountantOctopus from './fanal/hero/hero_accountant_octopus/left_hero_accountant_octopus.png';
import grilledChicken from './fanal/hero/hero_grilled_chicken/left_hero_grilled_chicken.png';
import robotJelly from './fanal/hero/hero_jelly_robot/left_hero_jelly_robot.png';
import pinkChocolateLizard from './fanal/hero/hero_pink_chocolate_lizard/left_hero_pink_chocolate_lizard.png';
import samuraiBread from './fanal/hero/hero_samurai_bread/left_hero_samurai_bread.png';
import tofuRabbit from './fanal/hero/hero_tofu_rabbit/left_hero_tofu_rabbit.png';

const HERO_IMAGES: Readonly<Record<string, string>> = {
  accountant_octopus: accountantOctopus,
  grilled_chicken: grilledChicken,
  robot_jelly: robotJelly,
  pink_chocolate_lizard: pinkChocolateLizard,
  samurai_bread: samuraiBread,
  tofu_rabbit: tofuRabbit,
};

export function heroImageForSlug(slug: string): string | null {
  return HERO_IMAGES[slug] ?? null;
}
