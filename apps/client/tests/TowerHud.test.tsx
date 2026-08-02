import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TowerHud } from '../src/ui/tower/TowerHud';
import { createLocalTowerHudModel } from '../src/ui/tower/towerHudModel';
import { initialHudState } from '../src/game/bridge';

describe('Sticker Adventure Tower HUD', () => {
  it('renders shared game controls and minimap with accessible labels', () => {
    const toggle = vi.fn();
    render(<TowerHud model={createLocalTowerHudModel(initialHudState)} onToggleAuto={toggle} onPause={() => {}} />);
    expect(screen.getByText('LOCAL ADVENTURE')).toBeInTheDocument();
    expect(screen.getByLabelText('Floor 1 minimap')).toBeInTheDocument();
    expect(screen.getByText('Floor 1 · The Odd Beginning')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /auto hunt/i }));
    expect(toggle).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /interact/i })).toBeDisabled();
  });
});
