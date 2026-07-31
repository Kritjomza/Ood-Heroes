import type { DomainErrorCode } from '@odd-tower/network-protocol';

type ReservationResult =
  | { ok: true }
  | { ok: false; code: Extract<DomainErrorCode, 'PLAYER_ALREADY_CONNECTED'> };

export class ActiveUserRegistry {
  readonly #roomByUser = new Map<string, string>();

  reserve(userId: string, roomId: string): ReservationResult {
    const currentRoom = this.#roomByUser.get(userId);
    if (currentRoom !== undefined && currentRoom !== roomId)
      return { ok: false, code: 'PLAYER_ALREADY_CONNECTED' };
    this.#roomByUser.set(userId, roomId);
    return { ok: true };
  }

  reconnect(userId: string, roomId: string): ReservationResult {
    return this.#roomByUser.get(userId) === roomId
      ? { ok: true }
      : { ok: false, code: 'PLAYER_ALREADY_CONNECTED' };
  }

  release(userId: string, roomId: string) {
    if (this.#roomByUser.get(userId) === roomId) this.#roomByUser.delete(userId);
  }

  releaseRoom(roomId: string) {
    let released = 0;
    for (const [userId, reservedRoomId] of this.#roomByUser) {
      if (reservedRoomId !== roomId) continue;
      this.#roomByUser.delete(userId);
      released += 1;
    }
    return released;
  }

  isActive(userId: string) {
    return this.#roomByUser.has(userId);
  }
}
