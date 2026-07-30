import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModeSelection } from '../src/ui/ModeSelection';
import { OnlineHud } from '../src/ui/OnlineHud';
import { OnlineLobby } from '../src/ui/OnlineLobby';
import { initialMultiplayerState } from '../src/game/multiplayer/MultiplayerBridge';

describe('online mode UI', () => {
  it('offers explicit Local Prototype and Online Movement Sandbox modes', () => {
    const local = vi.fn();
    const online = vi.fn();
    render(<ModeSelection onLocal={local} onOnline={online} />);
    fireEvent.click(screen.getByRole('button', { name: 'Local Prototype' }));
    fireEvent.click(screen.getByRole('button', { name: 'Online Movement Sandbox' }));
    expect(local).toHaveBeenCalledOnce();
    expect(online).toHaveBeenCalledOnce();
  });

  it('renders accessible lobby fields and dispatches create and exact-code join', () => {
    const create = vi.fn();
    const join = vi.fn();
    render(<OnlineLobby busy={false} error="" onCreate={create} onJoin={join} onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Player' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }));
    expect(create).toHaveBeenCalledWith('Player');
    fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'abc234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(join).toHaveBeenCalledWith('Player', 'abc234');
  });

  it('announces lobby errors and exposes in-room connection, player, latency, and leave controls', () => {
    const leave = vi.fn();
    const view = render(
      <OnlineLobby
        busy={false}
        error="That room could not be found."
        onCreate={() => {}}
        onJoin={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('That room could not be found.');
    view.rerender(
      <OnlineHud
        state={{
          ...initialMultiplayerState,
          connection: 'connected',
          roomCode: 'ABC234',
          displayName: 'Player',
          playerCount: 3,
          latencyMs: 42,
        }}
        onLeave={leave}
      />,
    );
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(screen.getByText('42 ms')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Leave Room' }));
    expect(leave).toHaveBeenCalledOnce();
  });

  it('shows a reconnecting status overlay', () => {
    render(
      <OnlineHud
        state={{ ...initialMultiplayerState, connection: 'reconnecting' }}
        onLeave={() => {}}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Reconnecting');
  });
});
