import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './core/EventBus';

describe('EventBus lastValue behavior', () => {
  it('invokes listener immediately with last payload when subscribing after emit', () => {
    const bus = new EventBus();
    const fn = vi.fn();

    bus.emit('player:level-up', 3);
    bus.on('player:level-up', fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('uses the most recent payload for new subscribers', () => {
    const bus = new EventBus();
    const fn = vi.fn();

    bus.emit('player:level-up', 1);
    bus.emit('player:level-up', 2);
    bus.on('player:level-up', fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });
});
