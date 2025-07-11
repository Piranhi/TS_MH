import { initGameData } from '../core/gameData';
import { GameServices } from '../core/GameServices';
import { Player } from '../core/Player';
import { GameContext } from '../core/GameContext';
import { OfflineReason } from '../models/OfflineProgress';
import { applySkipState } from './SkipStates';
import './defaultSkipStates';
import fs from 'fs';

interface TestOptions {
  hours: number;
  skipState: number;
}

export class AutoTestRunner {
  private context!: GameContext;

  constructor(private options: TestOptions) {}

  async setup() {
    // Minimal DOM for HuntManager
    (global as any).document = {
      getElementById: () => ({ selectedIndex: 0 }),
    } as Document;

    initGameData();
    const services = GameServices.getInstance();
    const player = Player.initSingleton();
    this.context = GameContext.initialize(player, services);
    this.context.startNewRun(player.getPrestigeState(), true);
    this.context.flags.isGameReady = true;
  }

  applySkipState() {
    applySkipState(this.options.skipState, this.context);
  }

  runSimulation() {
    const durationMs = this.options.hours * 3600 * 1000;
    this.context.services.offlineManager.processOfflineSession({
      startTime: Date.now(),
      endTime: Date.now() + durationMs,
      duration: durationMs,
      reason: OfflineReason.Visibility,
    });
  }

  collectResults() {
    const stats = this.context.services.statsManager.getUserStats();
    return {
      hoursSimulated: this.options.hours,
      level: stats.level,
      renown: this.context.player.currentRenown,
    };
  }

  outputResults(results: any) {
    const dir = 'test-reports';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const file = `${dir}/report_${Date.now()}.json`;
    fs.writeFileSync(file, JSON.stringify(results, null, 2));
    console.log('Simulation results saved to', file);
    console.log(JSON.stringify(results, null, 2));
  }

  async run() {
    await this.setup();
    this.applySkipState();
    this.runSimulation();
    const results = this.collectResults();
    this.outputResults(results);
  }
}

if (require.main === module) {
  const hours = Number(process.argv[2] || '1');
  const skipState = Number(process.argv[3] || '0');
  const runner = new AutoTestRunner({ hours, skipState });
  runner.run();
}
