import { useCallback, useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { Direction } from '@odd-tower/game-core';
import { GameBridge } from './game/bridge';
import { createGame, type Controls } from './game/createGame';
import { Hud } from './ui/Hud';
import { Joystick } from './ui/Joystick';
const bridge = new GameBridge();
const controls: Controls = { mobile: null };
export function App() {
  const mount = useRef<HTMLDivElement>(null),
    game = useRef<Phaser.Game | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!mount.current || game.current) return;
    try {
      game.current = createGame(mount.current, bridge, controls);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      setError(true);
    }
    return () => {
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);
  const scene = () => game.current?.scene.getScene('game') as GameSceneApi | undefined;
  const mobile = useCallback((d: Direction | null) => {
    controls.mobile = d;
  }, []);
  if (error)
    return (
      <main className="fatal">
        <h1>Game initialization failed</h1>
        <p>Please reload and try again.</p>
      </main>
    );
  return (
    <main>
      <div id="game-root" ref={mount} />
      <Hud
        bridge={bridge}
        onToggleAuto={() => scene()?.toggleAuto()}
        onPause={() => scene()?.togglePause()}
      />
      <Joystick onDirection={mobile} />
    </main>
  );
}
type GameSceneApi = { toggleAuto: () => void; togglePause: () => void };
