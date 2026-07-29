import { useEffect, useRef, useState } from 'react';
import type { Direction } from '@odd-tower/game-core';
export function Joystick({ onDirection }: { onDirection: (d: Direction | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<Direction | null>(null);
  useEffect(() => {
    const reset = () => {
      setDir(null);
      onDirection(null);
    };
    window.addEventListener('blur', reset);
    window.addEventListener('pointerup', reset);
    window.addEventListener('pointercancel', reset);
    return () => {
      window.removeEventListener('blur', reset);
      window.removeEventListener('pointerup', reset);
      window.removeEventListener('pointercancel', reset);
    };
  }, [onDirection]);
  const move = (e: React.PointerEvent) => {
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect(),
      x = e.clientX - (r.left + r.width / 2),
      y = e.clientY - (r.top + r.height / 2);
    const next: Direction =
      Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down';
    setDir(next);
    onDirection(next);
  };
  return (
    <div
      ref={ref}
      className="joystick"
      aria-label="Movement joystick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
      }}
    >
      <span className={dir ?? ''}>●</span>
    </div>
  );
}
