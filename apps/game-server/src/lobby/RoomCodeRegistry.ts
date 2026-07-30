import {
  NETWORK_CONFIG,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  normalizeRoomCode,
  type ValidationResult,
} from '@odd-tower/network-protocol';

type Entry = { roomId: string; roomCode: string; playerCount: number; maxPlayers: number };

function randomCode() {
  let value = '';
  for (let index = 0; index < ROOM_CODE_LENGTH; index++)
    value += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  return value;
}

export class RoomCodeRegistry {
  private readonly byCode = new Map<string, Entry>();
  private readonly byRoomId = new Map<string, Entry>();

  constructor(private readonly makeCode: () => string = randomCode) {}

  get size() {
    return this.byCode.size;
  }

  register(roomId: string, maxPlayers: number = NETWORK_CONFIG.roomCapacity) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const normalized = normalizeRoomCode(this.makeCode());
      if (!normalized.ok || this.byCode.has(normalized.value)) continue;
      const entry = { roomId, roomCode: normalized.value, playerCount: 0, maxPlayers };
      this.byCode.set(entry.roomCode, entry);
      this.byRoomId.set(roomId, entry);
      return entry.roomCode;
    }
    throw new Error('Unable to allocate a unique room code');
  }

  resolve(
    input: unknown,
  ): ValidationResult<Entry, 'INVALID_ROOM_CODE' | 'ROOM_NOT_FOUND' | 'ROOM_FULL'> {
    const normalized = normalizeRoomCode(input);
    if (!normalized.ok) return normalized;
    const entry = this.byCode.get(normalized.value);
    if (!entry) return { ok: false, code: 'ROOM_NOT_FOUND' };
    if (entry.playerCount >= entry.maxPlayers) return { ok: false, code: 'ROOM_FULL' };
    return { ok: true, value: { ...entry } };
  }

  updatePlayerCount(roomId: string, playerCount: number) {
    const entry = this.byRoomId.get(roomId);
    if (entry) entry.playerCount = Math.max(0, Math.min(entry.maxPlayers, playerCount));
  }

  getByRoomId(roomId: string) {
    const entry = this.byRoomId.get(roomId);
    return entry ? { ...entry } : undefined;
  }

  removeByRoomId(roomId: string) {
    const entry = this.byRoomId.get(roomId);
    if (!entry) return;
    this.byRoomId.delete(roomId);
    this.byCode.delete(entry.roomCode);
  }
}
