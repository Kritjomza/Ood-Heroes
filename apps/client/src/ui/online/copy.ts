import type { AutoHuntState, ConnectionState } from '@odd-tower/network-protocol';

export const ONLINE_COPY = {
  temporaryProgress:
    'Online combat progress is temporary. Session progress resets when this room ends.',
  reconnecting: 'Reconnecting — finding the tower door again…',
  reconnectingDetail: 'Movement is paused while the room is restored.',
  wipeTitle: 'The squad became floor decorations!',
} as const;

export const AUTO_HUNT_COPY: Record<
  AutoHuntState,
  { status: string; button: string; icon: string }
> = {
  disabled: { status: 'Manual control', button: 'AUTO', icon: 'Zz' },
  'acquiring-target': {
    status: 'Looking for a snack-sized monster…',
    button: 'SEARCHING',
    icon: '⌕',
  },
  navigating: { status: 'The squad is doing its best!', button: 'AUTO ON', icon: '✦' },
  engaging: { status: 'The squad is doing its best!', button: 'AUTO ON', icon: '⚔' },
  retreating: { status: 'Strategic running away!', button: 'RETREATING', icon: '↩' },
  recovering: { status: 'Emergency snack break.', button: 'RECOVERING', icon: '♥' },
  waiting: { status: 'No snacks—uh, monsters—nearby.', button: 'WAITING', icon: '…' },
};

export const CONNECTION_COPY: Record<ConnectionState, string> = {
  offline: 'offline',
  connecting: 'connecting',
  connected: 'connected',
  disconnected: 'disconnected',
  reconnecting: 'reconnecting',
  failed: 'connection failed',
};
