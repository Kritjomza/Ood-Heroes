import { describe, expect, it } from 'vitest';
import { PartyRegistry } from '../../src/mmo/social/PartyRegistry.js';
import { PartyService } from '../../src/mmo/social/PartyService.js';

describe('persistent party service boundary', () => {
  it('keeps a four-player party bounded and invite-driven', () => {
    let sequence = 0;
    const service = new PartyService(new PartyRegistry(() => `party-${++sequence}`));
    const party = service.create('leader');
    service.invite(party.partyId, 'leader', 'member');
    service.accept(party.partyId, 'member');
    expect(service.members('leader')).toEqual(['leader', 'member']);
    expect(() => service.accept(party.partyId, 'unknown')).toThrow('party_invite_required');
  });
});
