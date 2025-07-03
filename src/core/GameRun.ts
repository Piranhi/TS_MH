// ===================================================
// GameRun.ts - Transient systems for a single run
// ===================================================
import { HuntManager } from "@/features/hunt/HuntManager";
import { Destroyable } from "@/core/Destroyable";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { TrainedStatManager } from "@/models/TrainedStatManager";
import { PrestigeState } from "@/shared/stats-types";
import { Trait } from "@/models/Trait";
import { bus } from "./EventBus";
import { GameContext } from "./GameContext";
import { EquipmentManager } from "@/models/EquipmentManager";
import { bindEvent } from "@/shared/utils/busUtils";
import { ResourceManager } from "@/features/inventory/ResourceManager";
import { MineManager } from "@/features/mine/MineManager";
import { BlacksmithManager } from "@/features/settlement/BlacksmithManager";

export interface RunStats {
	runId: string;
	duration: number;
	characterLevel: number;
	currentArea: string;
	enemiesDefeated: number;
	experience: number;
}

export class GameRun extends Destroyable {
	public readonly character: PlayerCharacter;
	public readonly huntManager: HuntManager;
	public readonly trainedStats: TrainedStatManager;
	public readonly equipmentManager: EquipmentManager;
	public readonly resourceManager: ResourceManager;
	public readonly mineManager: MineManager;
	public readonly blacksmithManager: BlacksmithManager;
	public readonly runStartTime: number;
	public readonly runId: string;
	public readonly traits: Trait[];

	private context: GameContext;

	constructor(opts: { prestigeState: PrestigeState; context: GameContext }) {
		super();

		this.context = opts.context;
		this.runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		this.runStartTime = Date.now();

		// Create transient systems
		this.traits = [Trait.getRandomTrait()];
		this.character = new PlayerCharacter(opts.prestigeState, this.traits);
		this.huntManager = new HuntManager();
		this.trainedStats = new TrainedStatManager();
		this.equipmentManager = new EquipmentManager();
		this.resourceManager = new ResourceManager();

		//const mineLevel = this.context.settlement.getBuilding("mine")?.level || 0;
		this.mineManager = new MineManager();
		this.blacksmithManager = new BlacksmithManager();

		this.setupEventBindings();
		this.initialize();
	}

	private setupEventBindings() {
		bindEvent(this.eventBindings, "hunt:XPearned", (amt) => this.handleXP(amt));
		bindEvent(this.eventBindings, "player:level-up", (lvl) => this.handleLevelUp(lvl));
		bindEvent(this.eventBindings, "hunt:areaKill", (data) => this.handleEnemyDefeated(data));
		bindEvent(this.eventBindings, "hunt:bossKill", (data) => this.handleBossDefeated(data));
	}

	private initialize() {
		// Initialize character with starting gear/abilities
		this.character.init();

		// Register transient systems with save manager
		const saveManager = this.context.services.saveManager;
		saveManager.updateRegister("playerCharacter", this.character);
		saveManager.updateRegister("huntManager", this.huntManager);
		saveManager.updateRegister("trainedManager", this.trainedStats);
		saveManager.updateRegister("resourceManager", this.resourceManager);
		saveManager.updateRegister("mineManager", this.mineManager);
		saveManager.updateRegister("blacksmithManager", this.blacksmithManager);

		// Emit that run is ready
		bus.emit("gameRun:initialized", this);
	}

	private handleXP(amt: number) {}

	private handleLevelUp(newLevel: number) {
		// Handle run-specific level up logic
		this.trainedStats.onLevelUp(newLevel);
		bus.emit("gameRun:levelUp", { runId: this.runId, level: newLevel });
	}

	private handleEnemyDefeated(data: { enemyId: string; areaId: string }) {
		// Track run-specific enemy kills
		bus.emit("gameRun:enemyDefeated", { runId: this.runId, ...data });
	}

	private handleBossDefeated(data: { areaId: string }) {
		// Track run-specific boss kills
		bus.emit("gameRun:bossDefeated", { runId: this.runId, ...data });
	}

	public getRunStats(): RunStats {
		return {
			runId: this.runId,
			duration: Date.now() - this.runStartTime,
			characterLevel: this.character.level,
			currentArea: this.huntManager.getActiveAreaID(),
			enemiesDefeated: this.context.services.statsManager.getUserStats().level, // You'll want to track this properly
			experience: 0, // Add proper experience tracking
		};
	}

	destroy() {
		// Clean up all transient systems
		this.character.destroy();
		this.huntManager.destroy();
		this.trainedStats.destroy();
		this.equipmentManager.destroy();
		this.resourceManager.destroy();
		this.mineManager.destroy();
		this.blacksmithManager.destroy();

		bus.emit("gameRun:destroyed", this.runId);
		super.destroy();
	}
}
