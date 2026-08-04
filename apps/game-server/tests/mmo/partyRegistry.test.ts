import { describe, expect, it } from 'vitest';
import { PartyRegistry } from '../../src/mmo/social/PartyRegistry.js';

describe('MMO persistent parties and friend consent', () => {
  it('requires explicit invitation acceptance and enforces four players', () => {
    const parties = new PartyRegistry(() => 'party-1');
    const party = parties.create('leader');
    parties.invite(party.partyId, 'leader', 'member-1');
    expect(() => parties.accept(party.partyId, 'member-2')).toThrow('party_invite_required');
    parties.accept(party.partyId, 'member-1');
    parties.invite(party.partyId, 'member-1', 'member-2');
    parties.accept(party.partyId, 'member-2');
    parties.invite(party.partyId, 'leader', 'member-3');
    parties.accept(party.partyId, 'member-3');
    expect(() => parties.invite(party.partyId, 'leader', 'member-4')).toThrow('party_full');
  });

  it('allows channel-follow affinity only after mutual friend consent', () => {
    const parties = new PartyRegistry(() => 'party-1');
    parties.requestFriend('a', 'b');
    expect(parties.canFollow('a', 'b')).toBe(false);
    parties.requestFriend('b', 'a');
    expect(parties.canFollow('a', 'b')).toBe(true);
    parties.revokeFriend('a', 'b');
    expect(parties.canFollow('a', 'b')).toBe(false);
  });
});
