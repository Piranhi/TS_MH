// ===================================================
// GameRun Implementation (works with any option above)
// ===================================================

import { HuntManager } from "@/features/hunt/HuntManager";
import { Destroyable } from "@/models/Destroyable";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { TrainedStatManager } from "@/models/TrainedStatManager";

export class GameRun extends Destroyable {
    public readonly character: PlayerCharacter;
    public readonly huntManager: HuntManager;
    public readonly trainedStats: TrainedStatManager;
    public readonly runStartTime: number;
    public readonly runId: string;

    constructor(opts: {
        prestigeState: PrestigeState;
        playerRef?: Player; // Option 1
        context?: GameContext; // Option 2
    }) {
        super();

        this.runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.runStartTime = Date.now();

        // Create transient systems
        this.character = new PlayerCharacter(opts.prestigeState);
        this.huntManager = new HuntManager();
        this.trainedStats = new TrainedStatManager();

        this.setupEventBindings();
        this.initialize();
    }

    private setupEventBindings() {
        this.eventBindings.push(bus.on("character:levelUp", this.handleLevelUp.bind(this)), bus.on("hunt:enemyDefeated", this.handleEnemyDefeated.bind(this)), bus.on("hunt:complete", this.handleHuntComplete.bind(this)));
    }

    private initialize() {
        // Initialize character with starting gear/abilities
        this.character.init();

        // Emit that run is ready
        bus.emit("gameRun:initialized", this);
    }

    private handleLevelUp(newLevel: number) {
        // Handle run-specific level up logic
        this.trainedStats.onLevelUp(newLevel);
        bus.emit("gameRun:levelUp", { runId: this.runId, level: newLevel });
    }

    public getRunStats(): RunStats {
        return {
            runId: this.runId,
            duration: Date.now() - this.runStartTime,
            characterLevel: this.character.level,
            currentArea: this.huntManager.currentArea,
            enemiesDefeated: this.huntManager.totalKills,
            experience: this.character.totalExperience,
        };
    }

    destroy() {
        // Clean up all transient systems
        this.character.destroy();
        this.huntManager.destroy();
        this.trainedStats.destroy();

        bus.emit("gameRun:destroyed", this.runId);
        super.destroy();
    }
}
