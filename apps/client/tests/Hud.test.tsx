import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameBridge, initialHudState } from '../src/game/bridge';
import { Hud } from '../src/ui/Hud';
describe('HUD', () => {
  it('toggles Auto Hunt and reflects bridge state', () => {
    const bridge = new GameBridge();
    const toggle = vi.fn();
    render(<Hud bridge={bridge} onToggleAuto={toggle} onPause={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /auto hunt/i }));
    expect(toggle).toHaveBeenCalledOnce();
    act(() => bridge.publish({ ...initialHudState, autoEnabled: true, autoState: 'navigating' }));
    expect(screen.getByText(/navigating/i)).toBeInTheDocument();
  });
  it('shows respawn and pause states', () => {
    const bridge = new GameBridge();
    render(<Hud bridge={bridge} onToggleAuto={() => {}} onPause={() => {}} />);
    act(() => bridge.publish({ ...initialHudState, paused: true, respawnSeconds: 5 }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/paused/i);
    expect(screen.getByText(/respawn in 5/i)).toBeInTheDocument();
  });
  it('cleans subscriptions', () => {
    const bridge = new GameBridge();
    const view = render(<Hud bridge={bridge} onToggleAuto={() => {}} onPause={() => {}} />);
    expect(bridge.listenerCount).toBe(1);
    view.unmount();
    expect(bridge.listenerCount).toBe(0);
  });
});
