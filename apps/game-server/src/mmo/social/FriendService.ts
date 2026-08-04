import { PartyRegistry } from './PartyRegistry.js';

export class FriendService {
  constructor(private readonly registry: PartyRegistry) {}

  request(fromAccountId: string, toAccountId: string) { this.registry.requestFriend(fromAccountId, toAccountId); }
  revoke(fromAccountId: string, toAccountId: string) { this.registry.revokeFriend(fromAccountId, toAccountId); }
  canFollow(followerAccountId: string, targetAccountId: string) { return this.registry.canFollow(followerAccountId, targetAccountId); }
}
