import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TowerLoader } from '../src/ui/persistent/TowerLoader';
import { AdventureNav } from '../src/ui/persistent/AdventureNav';

describe('Pocket Adventure shell', () => {
  it('uses phase-specific loading copy and exposes recovery', () => {
    const retry = vi.fn();
    const { rerender } = render(<TowerLoader phase="bootstrap" />);
    expect(screen.getByRole('status')).toHaveTextContent('Gathering your heroes');
    rerender(<TowerLoader phase="bootstrap" error="No connection" onRetry={retry} />);
    expect(screen.getByText('No connection')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Try again' }).click();
    expect(retry).toHaveBeenCalledOnce();
  });

  it('keeps all primary systems in one persistent navigation control', () => {
    const onSelect = vi.fn();
    render(<AdventureNav active="collection" onSelect={onSelect} />);
    expect(screen.getByRole('navigation', { name: 'Adventure' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Heroes' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(onSelect).toHaveBeenCalledWith('team');
  });
});
