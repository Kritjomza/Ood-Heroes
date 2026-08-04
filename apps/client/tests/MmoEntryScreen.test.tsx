import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MmoWorldUiState } from '../src/mmo/MmoWorldBridge';
import { MmoEntryScreen } from '../src/ui/mmo/MmoEntryScreen';
import { MmoWorldShell } from '../src/ui/mmo/MmoWorldShell';

const state = (connection: MmoWorldUiState['connection']): MmoWorldUiState => ({
  connection,
  zoneId: connection === 'connected' ? 'floor-1' : '',
  channelId: connection === 'connected' ? 'channel-7' : '',
  population: connection === 'connected' ? 12 : 0,
  worldRevision: connection === 'connected' ? 5 : 0,
  errorCode: connection === 'failed' ? 'connection_failed' : '',
});

describe('MMO entry and world shell', () => {
  it.each([
    ['locating', 'Finding your best channel'],
    ['joining', 'Opening the world gate'],
    ['recovering', 'Restoring your adventure'],
  ] as const)('announces the %s state', (connection, copy) => {
    render(
      <MmoEntryScreen state={state(connection)} onRetry={() => undefined} onReturnToLegacy={() => undefined} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(copy);
    expect(screen.queryByLabelText(/room code/iu)).not.toBeInTheDocument();
  });

  it('offers update guidance for an incompatible client and recovery for connection failure', () => {
    const retry = vi.fn();
    const legacy = vi.fn();
    const { rerender } = render(
      <MmoEntryScreen state={state('incompatible')} onRetry={retry} onReturnToLegacy={legacy} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Update Odd Tower');
    fireEvent.click(screen.getByRole('button', { name: 'Return to current adventure' }));
    expect(legacy).toHaveBeenCalledOnce();

    rerender(<MmoEntryScreen state={state('failed')} onRetry={retry} onReturnToLegacy={legacy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it('renders a safe-area world HUD with population and accessible controls', () => {
    const leave = vi.fn();
    const movement = vi.fn();
    const destroy = vi.fn();
    const { container, unmount } = render(
      <MmoWorldShell
        state={state('connected')}
        onLeave={leave}
        onMovement={movement}
        createGame={() => ({ destroy })}
      />,
    );

    expect(container.querySelector('.mmo-safe-frame')).toBeInTheDocument();
    expect(screen.getByText('12 / 30 adventurers')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Leave world' }));
    expect(leave).toHaveBeenCalledOnce();
    unmount();
    expect(destroy).toHaveBeenCalledWith(true);
  });
});
