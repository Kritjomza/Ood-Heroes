import { describe, expect, it } from 'vitest';
import { PrivateInstanceRegistry } from '../../src/mmo/instances/PrivateInstanceRegistry.js';

describe('MMO private instances', () => {
  it('supports four-player ready checks and starts only when everyone is ready', () => {
    const registry = new PrivateInstanceRegistry(() => 'instance-1');
    const instance = registry.create('story', 'leader', 42);
    registry.addMember(instance.instanceId, 'member-1');
    registry.addMember(instance.instanceId, 'member-2');
    registry.addMember(instance.instanceId, 'member-3');
    expect(() => registry.addMember(instance.instanceId, 'member-4')).toThrow('instance_party_full');
    expect(registry.setReady(instance.instanceId, 'leader', true).status).toBe('forming');
    registry.setReady(instance.instanceId, 'member-1', true);
    registry.setReady(instance.instanceId, 'member-2', true);
    expect(registry.setReady(instance.instanceId, 'member-3', true).status).toBe('active');
  });

  it('keeps only newer checkpoints and recovers from a transient disconnect', () => {
    const registry = new PrivateInstanceRegistry(() => 'instance-1');
    const instance = registry.create('dungeon', 'leader', 9, 2);
    registry.setReady(instance.instanceId, 'leader', true);
    registry.checkpoint(instance.instanceId, 4, { room: 2 });
    registry.checkpoint(instance.instanceId, 2, { room: 1 });
    expect(registry.get(instance.instanceId)!.checkpointPayload).toEqual({ room: 2 });
    expect(registry.disconnect(instance.instanceId).status).toBe('recovering');
    expect(registry.reconnect(instance.instanceId).status).toBe('active');
  });

  it('allows limited revive tokens only in dungeons', () => {
    const registry = new PrivateInstanceRegistry(() => 'instance-1');
    const dungeon = registry.create('dungeon', 'leader', 1, 1);
    expect(registry.consumeReviveToken(dungeon.instanceId, 'leader')).toBe(true);
    expect(registry.consumeReviveToken(dungeon.instanceId, 'leader')).toBe(false);
    const story = registry.create('story', 'story-player', 1, 1);
    expect(() => registry.consumeReviveToken(story.instanceId, 'story-player')).toThrow('revive_tokens_not_allowed');
  });
});
