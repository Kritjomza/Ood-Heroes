import { describe, expect, it } from 'vitest';
import { FriendService } from '../../src/mmo/social/FriendService.js';
import { PartyRegistry } from '../../src/mmo/social/PartyRegistry.js';

describe('consent-based friend following', () => {
  it('requires mutual consent and revokes both directions', () => {
    const friend = new FriendService(new PartyRegistry(() => 'party'));
    friend.request('a', 'b');
    expect(friend.canFollow('a', 'b')).toBe(false);
    friend.request('b', 'a');
    expect(friend.canFollow('a', 'b')).toBe(true);
    friend.revoke('a', 'b');
    expect(friend.canFollow('a', 'b')).toBe(false);
  });
});
