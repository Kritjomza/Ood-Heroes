import { describe, expect, it } from 'vitest';
import {
  WORLD_VISUALS,
  validateWorldVisuals,
  worldVisualFor,
} from '../src/assets/world-visuals';

describe('single-image world visual registry', () => {
  it('contains one canonical world image for every Floor 1 moving identity', () => {
    expect(WORLD_VISUALS).toHaveLength(17);
    expect(
      WORLD_VISUALS.filter((visual) => visual.id.startsWith('hero_')).every((visual) =>
        visual.sourcePath.endsWith('.png'),
      ),
    ).toBe(true);
    expect(WORLD_VISUALS.every((visual) => visual.frameCount === 1)).toBe(true);
    expect(validateWorldVisuals(WORLD_VISUALS)).toEqual([]);
  });

  it('maps persistent heroes, monsters, boss, adds, and moving NPCs', () => {
    expect(worldVisualFor('hero_001_grilled_chicken')?.textureKey).toBe('hero.grilled_chicken.world');
    expect(worldVisualFor('grumpy-radish')?.motionProfile).toBe('normal');
    expect(worldVisualFor('angry-refrigerator')?.motionProfile).toBe('boss');
    expect(worldVisualFor('frozen-food-add-left')?.motionProfile).toBe('light');
    expect(worldVisualFor('summon-shrine-keeper')?.motionProfile).toBe('floating');
    expect(worldVisualFor('unknown')).toBeNull();
  });

  it('rejects duplicate IDs, invalid anchors, and unsupported multi-frame entries', () => {
    const invalid = [
      ...WORLD_VISUALS,
      { ...WORLD_VISUALS[0]!, sourcePath: '/bad/sheet.png', anchorX: 2, frameCount: 4 },
    ];
    expect(validateWorldVisuals(invalid)).toEqual(
      expect.arrayContaining([
        `Duplicate world visual id: ${WORLD_VISUALS[0]!.id}`,
        `Invalid world visual anchor: ${WORLD_VISUALS[0]!.id}`,
        `World visual must be one supported image: ${WORLD_VISUALS[0]!.id}`,
      ]),
    );
  });
});
