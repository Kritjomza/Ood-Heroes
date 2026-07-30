import { describe, expect, it } from 'vitest';
import { PredictionController } from '../src/game/multiplayer/prediction';

describe('local prediction and reconciliation', () => {
  it('predicts immediately with shared collision and bounds', () => {
    const open = new PredictionController({ x: 1024, y: 1024 });
    const input = open.applyInput('right', 10);
    expect(input?.sequence).toBe(1);
    expect(open.position).toEqual({ x: 1030, y: 1024 });

    const wall = new PredictionController({ x: 559, y: 544 });
    wall.applyInput('right', 10);
    expect(wall.position).toEqual({ x: 559, y: 544 });

    const edge = new PredictionController({ x: 15, y: 100 });
    edge.applyInput('left', 10);
    expect(edge.position.x).toBe(15);
  });

  it('bounds pending storage and stops prediction on disconnect', () => {
    const controller = new PredictionController({ x: 1024, y: 1024 });
    for (let index = 0; index < 70; index++) controller.applyInput('none', index);
    expect(controller.pendingCount).toBe(64);
    controller.disconnect();
    expect(controller.pendingCount).toBe(0);
    const before = controller.position;
    expect(controller.applyInput('right', 100)).toBeNull();
    expect(controller.position).toEqual(before);
  });

  it('reports no correction when authoritative state plus replay matches prediction', () => {
    const controller = new PredictionController({ x: 1024, y: 1024 });
    controller.applyInput('right', 0);
    expect(controller.reconcile({ x: 1024, y: 1024 }, 0).kind).toBe('none');
    expect(controller.position).toEqual({ x: 1030, y: 1024 });
  });

  it('classifies small and hard authoritative corrections', () => {
    const smooth = new PredictionController({ x: 1024, y: 1024 });
    smooth.applyInput('right', 0);
    expect(smooth.reconcile({ x: 1020, y: 1024 }, 1)).toMatchObject({ kind: 'smooth' });

    const hard = new PredictionController({ x: 1024, y: 1024 });
    hard.applyInput('right', 0);
    expect(hard.reconcile({ x: 900, y: 1024 }, 1)).toMatchObject({ kind: 'snap' });
  });

  it('replays one or many unacknowledged inputs and removes full acknowledgement', () => {
    const one = new PredictionController({ x: 1024, y: 1024 });
    one.applyInput('right', 0);
    one.applyInput('right', 50);
    one.reconcile({ x: 1030, y: 1024 }, 1);
    expect(one.position).toEqual({ x: 1036, y: 1024 });
    expect(one.pendingCount).toBe(1);

    const many = new PredictionController({ x: 1024, y: 1024 });
    many.applyInput('down', 0);
    many.applyInput('down', 50);
    many.applyInput('down', 100);
    many.reconcile({ x: 1024, y: 1024 }, 0);
    expect(many.position).toEqual({ x: 1024, y: 1042 });
    many.reconcile({ x: 1024, y: 1042 }, 3);
    expect(many.pendingCount).toBe(0);
  });

  it('resets pending state and position after reconnection', () => {
    const controller = new PredictionController({ x: 1024, y: 1024 });
    controller.applyInput('right', 0);
    controller.reset({ x: 1100, y: 1100 });
    expect(controller.position).toEqual({ x: 1100, y: 1100 });
    expect(controller.pendingCount).toBe(0);
  });

  it('shares its monotonic sequence with idle heartbeats and resumes from server acknowledgement', () => {
    const controller = new PredictionController({ x: 1024, y: 1024 });
    expect(controller.applyInput('none', 0)?.sequence).toBe(1);
    expect(controller.createHeartbeat(50).sequence).toBe(2);
    controller.reset({ x: 1024, y: 1024 }, 20);
    expect(controller.applyInput('right', 100)?.sequence).toBe(21);
  });
});
