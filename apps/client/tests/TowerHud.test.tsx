import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TowerHud } from '../src/ui/tower/TowerHud';
import { createLocalTowerHudModel } from '../src/ui/tower/towerHudModel';
import { initialHudState } from '../src/game/bridge';
import { FLOOR_ONE_MAP } from '@odd-tower/game-core';
import { createFloorOneMinimapModel } from '../src/ui/tower/towerHudModel';

const minimap = createFloorOneMinimapModel({
  map: FLOOR_ONE_MAP,
  tileSize: 32,
  player: { x: 1024, y: 1536, facing: 'left' },
});

describe('Sticker Adventure Tower HUD', () => {
  it('renders shared game controls and minimap with accessible labels', () => {
    const toggle = vi.fn();
    render(<TowerHud model={createLocalTowerHudModel(initialHudState)} onToggleAuto={toggle} onPause={() => {}} />);
    expect(screen.getByText('LOCAL ADVENTURE')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Floor 1 minimap/i)).toBeInTheDocument();
    expect(screen.getByText('Floor 1 · The Odd Beginning')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /auto hunt/i }));
    expect(toggle).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /interact/i })).toBeDisabled();
  });

  it('opens the Floor 1 map and restores focus when closed', () => {
    render(<TowerHud model={createLocalTowerHudModel(initialHudState)} minimap={minimap} onToggleAuto={() => {}} onPause={() => {}} />);
    const opener = screen.getByRole('button', { name: /open floor 1 map/i });

    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: /floor 1 map/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /floor 1 map/i })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('keeps all four primary actions available', () => {
    render(<TowerHud model={createLocalTowerHudModel(initialHudState)} minimap={minimap} onToggleAuto={() => {}} onPause={() => {}} />);
    for (const name of ['Bonk', 'Odd skill', 'Snack', 'Interact']) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument();
    }
  });

  it('exposes named perimeter regions and honest tool states', () => {
    render(<TowerHud model={createLocalTowerHudModel(initialHudState)} minimap={minimap} onToggleAuto={() => {}} onPause={() => {}} />);
    expect(screen.getByRole('region', { name: /party status/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /floor objective/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /combat actions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inventory locked/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /auto hunt/i })).toHaveAttribute('aria-pressed', 'false');
  });
});
