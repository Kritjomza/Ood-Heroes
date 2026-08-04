export type PartyRecord = {
  partyId: string;
  leaderAccountId: string;
  memberAccountIds: string[];
  pendingInvites: string[];
};

export class PartyRegistry {
  private readonly parties = new Map<string, PartyRecord>();
  private readonly accountParty = new Map<string, string>();
  private readonly friendConsent = new Set<string>();

  constructor(private readonly createPartyId: () => string) {}

  create(leaderAccountId: string) {
    if (this.accountParty.has(leaderAccountId)) throw new Error('account_already_in_party');
    const party: PartyRecord = { partyId: this.createPartyId(), leaderAccountId, memberAccountIds: [leaderAccountId], pendingInvites: [] };
    this.parties.set(party.partyId, party);
    this.accountParty.set(leaderAccountId, party.partyId);
    return clone(party);
  }

  invite(partyId: string, inviterAccountId: string, targetAccountId: string) {
    const party = this.require(partyId);
    if (!party.memberAccountIds.includes(inviterAccountId)) throw new Error('party_member_required');
    if (party.memberAccountIds.length >= 4) throw new Error('party_full');
    if (!party.pendingInvites.includes(targetAccountId)) party.pendingInvites.push(targetAccountId);
    return clone(party);
  }

  accept(partyId: string, accountId: string) {
    const party = this.require(partyId);
    if (!party.pendingInvites.includes(accountId)) throw new Error('party_invite_required');
    if (this.accountParty.has(accountId)) throw new Error('account_already_in_party');
    party.pendingInvites = party.pendingInvites.filter((id) => id !== accountId);
    party.memberAccountIds.push(accountId);
    this.accountParty.set(accountId, partyId);
    return clone(party);
  }

  leave(accountId: string) {
    const partyId = this.accountParty.get(accountId);
    if (!partyId) return;
    const party = this.require(partyId);
    party.memberAccountIds = party.memberAccountIds.filter((id) => id !== accountId);
    this.accountParty.delete(accountId);
    if (party.leaderAccountId === accountId) party.leaderAccountId = party.memberAccountIds[0] ?? '';
    if (party.memberAccountIds.length === 0) this.parties.delete(partyId);
  }

  requestFriend(fromAccountId: string, toAccountId: string) {
    this.friendConsent.add(key(fromAccountId, toAccountId));
  }

  revokeFriend(fromAccountId: string, toAccountId: string) {
    this.friendConsent.delete(key(fromAccountId, toAccountId));
    this.friendConsent.delete(key(toAccountId, fromAccountId));
  }

  canFollow(followerAccountId: string, targetAccountId: string) {
    return this.friendConsent.has(key(followerAccountId, targetAccountId)) && this.friendConsent.has(key(targetAccountId, followerAccountId));
  }

  members(accountId: string) {
    const partyId = this.accountParty.get(accountId);
    return partyId ? [...this.require(partyId).memberAccountIds] : [];
  }

  partyOf(accountId: string) {
    const partyId = this.accountParty.get(accountId);
    return partyId ? clone(this.require(partyId)) : null;
  }

  get(partyId: string) {
    return clone(this.require(partyId));
  }

  private require(partyId: string) {
    const party = this.parties.get(partyId);
    if (!party) throw new Error('party_not_found');
    return party;
  }
}

function key(left: string, right: string) { return `${left}:${right}`; }
function clone(party: PartyRecord): PartyRecord { return { ...party, memberAccountIds: [...party.memberAccountIds], pendingInvites: [...party.pendingInvites] }; }
