import { PartyRegistry, type PartyRecord } from './PartyRegistry.js';

export class PartyService {
  constructor(private readonly registry: PartyRegistry) {}

  create(leaderAccountId: string) { return this.registry.create(leaderAccountId); }
  invite(partyId: string, inviterAccountId: string, targetAccountId: string) { return this.registry.invite(partyId, inviterAccountId, targetAccountId); }
  accept(partyId: string, accountId: string) { return this.registry.accept(partyId, accountId); }
  leave(accountId: string) { return this.registry.leave(accountId); }
  members(accountId: string) { return this.registry.members(accountId); }
  get(partyId: string): PartyRecord { return this.registry.get(partyId); }
}
