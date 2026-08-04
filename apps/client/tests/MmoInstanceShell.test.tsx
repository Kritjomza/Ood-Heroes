import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MmoInstanceShell } from '../src/ui/mmo/MmoInstanceShell';
import { initialMmoInstanceState } from '../src/mmo/MmoInstanceClient';

describe('MMO instance shell', () => {
  it('keeps ready, revive, completion, and return actions readable', () => {
    render(<MmoInstanceShell state={{ ...initialMmoInstanceState, connection: 'connected', kind: 'dungeon', memberCount: 2, encounterCount: 5, reviveTokens: 1 }} onReady={vi.fn()} onRevive={vi.fn()} onComplete={vi.fn()} onLeave={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ready up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revive' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return to world' })).toBeInTheDocument();
  });
});
