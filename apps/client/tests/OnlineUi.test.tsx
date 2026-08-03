import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModeSelection } from '../src/ui/ModeSelection';
import { OnlineHud } from '../src/ui/OnlineHud';
import { OnlineLobby } from '../src/ui/OnlineLobby';
import { initialMultiplayerState } from '../src/game/multiplayer/MultiplayerBridge';

describe('online mode UI', () => {
  it('offers explicit Local Prototype and Online Shared Combat Sandbox modes', () => {
    const local = vi.fn();
    const online = vi.fn();
    render(<ModeSelection onLocal={local} onOnline={online} />);
    fireEvent.click(screen.getByRole('button', { name: 'Local Prototype' }));
    fireEvent.click(screen.getByRole('button', { name: 'Online Shared Combat Sandbox' }));
    expect(local).toHaveBeenCalledOnce();
    expect(online).toHaveBeenCalledOnce();
  });

  it('presents the tower gate and dispatches create and exact-code join', () => {
    const create = vi.fn();
    const join = vi.fn();
    const back = vi.fn();
    render(<OnlineLobby busy={false} error="" onCreate={create} onJoin={join} onBack={back} />);
    expect(screen.getByRole('heading', { name: 'Gather at the Tower Gate' })).toBeVisible();
    expect(screen.queryByText(/phase 3|sandbox/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start an expedition' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByLabelText('Room code')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Player' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }));
    expect(create).toHaveBeenCalledWith('Player');
    fireEvent.click(screen.getByRole('button', { name: 'Join your party' }));
    fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'abc234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(join).toHaveBeenCalledWith('Player', 'abc234');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(back).toHaveBeenCalledOnce();
  });

  it('announces the gate opening and prevents duplicate room actions', () => {
    const create = vi.fn();
    const join = vi.fn();
    render(<OnlineLobby busy error="" onCreate={create} onJoin={join} onBack={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Opening the gate…');
    const submit = screen.getByRole('button', { name: 'Create Room' });
    expect(submit).toBeDisabled();
    fireEvent.submit(submit.closest('form')!);
    expect(create).not.toHaveBeenCalled();
    expect(join).not.toHaveBeenCalled();
  });

  it('requires a complete room code and gives path-aware recovery guidance', () => {
    const view = render(
      <OnlineLobby
        busy={false}
        error="The request failed."
        onCreate={() => {}}
        onJoin={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('room code');
    fireEvent.click(screen.getByRole('button', { name: 'Join your party' }));
    expect(screen.getByRole('button', { name: 'Join Room' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'ABC12' } });
    expect(screen.getByRole('button', { name: 'Join Room' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Room code'), { target: { value: 'ABC123' } });
    expect(screen.getByRole('button', { name: 'Join Room' })).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Check the room code and try again.');
    view.unmount();
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
        onToggleAutoHunt={() => {}}
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
        onToggleAutoHunt={() => {}}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Reconnecting');
  });

  it('labels temporary progression and sends one accessible Auto Hunt toggle', () => {
    const toggle = vi.fn();
    render(
      <OnlineHud
        state={{
          ...initialMultiplayerState,
          connection: 'connected',
          sessionGold: 9,
          autoHuntState: 'engaging',
          heroes: [
            {
              id: 'p:fighter',
              definitionId: 'hero_001_grilled_chicken',
              role: 'fighter',
              level: 3,
              experience: 20,
              nextExperience: 220,
              currentHp: 90,
              maxHp: 130,
              status: 'alive',
            },
          ],
        }}
        onLeave={() => {}}
        onToggleAutoHunt={toggle}
      />,
    );
    expect(screen.getByText(/online combat progress is temporary/i)).toBeInTheDocument();
    expect(screen.getByText(/Session Gold: 9/i)).toBeInTheDocument();
    expect(screen.getByText(/Session Level 3/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /auto hunt/i }));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('shows playful but explicit combat status and a server-authoritative wipe countdown', () => {
    const view = render(
      <OnlineHud
        state={{
          ...initialMultiplayerState,
          connection: 'connected',
          autoHuntEnabled: true,
          autoHuntState: 'retreating',
          respawnSeconds: 0,
        }}
        onLeave={() => {}}
        onToggleAutoHunt={() => {}}
      />,
    );
    expect(screen.getByRole('status', { name: 'Combat status' })).toHaveTextContent(
      'Strategic running away',
    );
    expect(screen.getByRole('button', { name: 'Auto Hunt' })).toHaveTextContent('RETREATING');
    view.rerender(
      <OnlineHud
        state={{ ...initialMultiplayerState, connection: 'connected', respawnSeconds: 5 }}
        onLeave={() => {}}
        onToggleAutoHunt={() => {}}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Team respawn' })).toHaveTextContent(
      'The squad became floor decorations',
    );
    expect(screen.getByRole('dialog', { name: 'Team respawn' })).toHaveTextContent(
      'Respawning in 5',
    );
  });

  it('uses text as well as color for defeated and slowed hero states', () => {
    render(
      <OnlineHud
        state={{
          ...initialMultiplayerState,
          heroes: [
            {
              id: 'p:tank',
              definitionId: 'hero_003_robot_jelly',
              role: 'tank',
              level: 1,
              experience: 0,
              nextExperience: 50,
              currentHp: 30,
              maxHp: 100,
              status: 'alive',
              slowed: true,
            },
            {
              id: 'p:support',
              definitionId: 'hero_004_tofu_rabbit',
              role: 'support',
              level: 1,
              experience: 0,
              nextExperience: 50,
              currentHp: 0,
              maxHp: 80,
              status: 'defeated',
            },
          ],
        }}
        onLeave={() => {}}
        onToggleAutoHunt={() => {}}
      />,
    );
    expect(screen.getByText('Slowed')).toBeInTheDocument();
    expect(screen.getByText('Defeated')).toBeInTheDocument();
  });

  it('projects online local-player coordinates into the shared minimap', () => {
    render(
      <OnlineHud
        state={{
          ...initialMultiplayerState,
          world: { player: { x: 1536, y: 512, facing: 'right' }, portalUnlocked: true, guardianActive: false },
        }}
        onLeave={() => {}}
        onToggleAutoHunt={() => {}}
      />,
    );
    expect(screen.getByLabelText(/player at 75 percent, 25 percent/i)).toBeInTheDocument();
  });
});
