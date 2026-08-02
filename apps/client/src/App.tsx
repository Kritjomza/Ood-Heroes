import { useCallback, useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { Direction } from '@odd-tower/game-core';
import { GameBridge } from './game/bridge';
import { createGame, type Controls } from './game/createGame';
import { createMultiplayerGame } from './game/createMultiplayerGame';
import { MultiplayerBridge, initialMultiplayerState } from './game/multiplayer/MultiplayerBridge';
import { MultiplayerClient } from './game/multiplayer/MultiplayerClient';
import { Hud } from './ui/Hud';
import { Joystick } from './ui/Joystick';
import { ModeSelection } from './ui/ModeSelection';
import { OnlineHud } from './ui/OnlineHud';
import { OnlineLobby } from './ui/OnlineLobby';
import { PersistentShell } from './ui/persistent/PersistentShell';
import { authConfigured } from './persistence/auth-client';

type Mode = 'persistent' | 'selection' | 'local' | 'online-lobby' | 'online-room';

export function App() {
  const [mode, setMode] = useState<Mode>(() => (authConfigured() ? 'persistent' : 'selection'));
  const bridge = useRef(new MultiplayerBridge()).current;
  const client = useRef(new MultiplayerClient(bridge)).current;
  const [networkState, setNetworkState] = useState(initialMultiplayerState);
  useEffect(() => bridge.subscribe(setNetworkState), [bridge]);
  useEffect(() => {
    if (mode === 'online-room' && networkState.connection === 'failed') setMode('online-lobby');
  }, [mode, networkState.connection]);

  const connect = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      setMode('online-room');
    } catch {
      setMode('online-lobby');
    }
  };
  const leaveOnline = async () => {
    await client.leave();
    setMode('online-lobby');
  };

  if (mode === 'persistent')
    return (
      <PersistentShell
        onPlayLocal={() => setMode('local')}
        onPlayOnline={() => setMode('online-lobby')}
      />
    );
  if (mode === 'selection')
    return (
      <main className="menu-shell">
        <ModeSelection onLocal={() => setMode('local')} onOnline={() => setMode('online-lobby')} />
      </main>
    );
  if (mode === 'local')
    return <LocalMode onBack={() => setMode(authConfigured() ? 'persistent' : 'selection')} />;
  if (mode === 'online-lobby')
    return (
      <main className="menu-shell">
        <OnlineLobby
          busy={networkState.connection === 'connecting'}
          error={networkState.error}
          onCreate={(name) => void connect(() => client.createRoom(name))}
          onJoin={(name, code) => void connect(() => client.joinRoom(name, code))}
          onBack={() => {
            bridge.reset();
            setMode(authConfigured() ? 'persistent' : 'selection');
          }}
        />
      </main>
    );
  return <OnlineMode client={client} state={networkState} onLeave={() => void leaveOnline()} />;
}

function LocalMode({ onBack }: { onBack: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const bridge = useRef(new GameBridge()).current;
  const controls = useRef<Controls>({ mobile: null }).current;
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!mount.current || game.current) return;
    try {
      game.current = createGame(mount.current, bridge, controls);
    } catch (caught) {
      if (import.meta.env.DEV) console.error(caught);
      setError(true);
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, [bridge, controls]);
  const scene = () => game.current?.scene.getScene('game') as GameSceneApi | undefined;
  const mobile = useCallback(
    (direction: Direction | null) => {
      controls.mobile = direction;
    },
    [controls],
  );
  if (error) return <FatalGame />;
  return (
    <main>
      <div id="game-root" ref={mount} />
      <Hud
        bridge={bridge}
        onToggleAuto={() => scene()?.toggleAuto()}
        onPause={() => scene()?.togglePause()}
        onLeave={onBack}
      />
      <Joystick onDirection={mobile} />
    </main>
  );
}

function OnlineMode({
  client,
  state,
  onLeave,
}: {
  client: MultiplayerClient;
  state: typeof initialMultiplayerState;
  onLeave: () => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const controls = useRef<{ mobile: Direction | null }>({ mobile: null }).current;
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!mount.current || game.current) return;
    try {
      game.current = createMultiplayerGame(mount.current, client, controls);
    } catch (caught) {
      if (import.meta.env.DEV) console.error(caught);
      setError(true);
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, [client, controls]);
  const mobile = useCallback(
    (direction: Direction | null) => {
      controls.mobile = direction;
    },
    [controls],
  );
  if (error) return <FatalGame />;
  return (
    <main>
      <div id="game-root" ref={mount} />
      <OnlineHud
        state={state}
        onLeave={onLeave}
        onToggleAutoHunt={() => client.setAutoHunt(!state.autoHuntEnabled)}
      />
      <Joystick onDirection={mobile} />
    </main>
  );
}

function FatalGame() {
  return (
    <main className="fatal">
      <h1>Game initialization failed</h1>
      <p>Please return to the lobby and try again.</p>
    </main>
  );
}

type GameSceneApi = { toggleAuto: () => void; togglePause: () => void };
