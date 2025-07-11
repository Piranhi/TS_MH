import { GameContext } from '../core/GameContext';
import { registerSkipState } from './SkipStates';

// Skipstate 0 - initial start
registerSkipState({
  id: 0,
  description: 'Base game start',
  apply: (ctx: GameContext) => {
    ctx.stats.unlockArea('forest_easy');
    ctx.hunt.setArea('forest_easy');
  }
});

// Skipstate 1 - after first boss
registerSkipState({
  id: 1,
  description: 'Defeated first boss, unlock next area and build guild',
  apply: (ctx: GameContext) => {
    // apply previous skipstates
    ctx.stats.unlockArea('forest_easy');
    ctx.stats.getAreaStats('forest_easy').bossKilledThisRun = true;
    ctx.stats.unlockArea('duskwolf_grove');
    ctx.settlement.changeBuildingStatus('guild_hall', 'built');
  }
});
