// HuntManager.ts
// The finite‑state controller that drives the core idle loop (Search → Combat → Recovery).
// You will iterate on this; for now it is deliberately minimal but functional.
import { bus } from "@/core/EventBus";
import { CombatManager } from "./CombatManager";
import { EnemyCharacter } from "../../models//EnemyCharacter";
import { Area } from "@/models/Area";
import { Saveable } from "@/shared/storage-types";
import { saveManager } from "@/core/SaveManager";
import { debugManager, printLog } from "@/core/DebugManager";
import { Player } from "@/models/player";

export enum HuntState {
	Idle = "Idle",
	Search = "Search",
	Combat = "Combat",
	Recovery = "Recovery",
	Boss = "Boss",
}

interface HuntSaveState {
	huntState: HuntState;
	areaId: string;
	areaIndex: number;
}

/**
 * Minimal interface every concrete state must implement.
 * `tick` is called every game‑loop iteration; `dt` is milliseconds elapsed since the previous call.
 */
interface StateHandler {
	onEnter(): void;
	onExit(): void;
	onTick(dt: number): void;
}

export class HuntManager implements Saveable {
	private state: HuntState = HuntState.Idle; // current enum value – useful for save files
	private handler: StateHandler;
	private area!: Area;
	private areaIndex: number = 0;

	constructor() {
		this.handler = this.makeIdleState();
		this.transition(HuntState.Idle, this.makeIdleState());

		bus.on("Game:GameTick", (dt) => this.onTick(dt));
		bus.on("hunt:areaSelected", (areaId) => this.setArea(areaId));
		bus.on("game:gameReady", () => {
			const areaSelector = document.getElementById("area-select")! as HTMLSelectElement;
			areaSelector.selectedIndex = this.areaIndex;
		});
	}

	/** Change the hunting grounds without restarting the whole loop. */
	public setArea(areaId: string) {
		this.area = Area.create(areaId);
		//StatsManager.instance.getAreaStats(areaId);
		this.transition(HuntState.Search, this.makeSearchState());
		printLog("Setting new Area to: " + this.area.id, 3, "HuntManager.ts");
	}

	public onTick(dt: number) {
		this.handler.onTick(dt);
	}

	// ────────────────────────────────────────────────────────────────────────────
	//  STATE FACTORIES – each returns a fresh object that closes over any
	//  state‑specific variables it needs (e.g., the current enemy instance).
	// ────────────────────────────────────────────────────────────────────────────

	// IDLE STATE
	private makeIdleState(): StateHandler {
		return {
			onEnter: () => {
				bus.emit("hunt:stateChanged", HuntState.Idle);
			},
			onTick: (dt: number) => {},
			onExit: () => {},
		};
	}

	// SEARCH STATE
	private makeSearchState(): StateHandler {
		// Local closure variable keeps track of an accumulated timer so that we roll
		// once per second independent of frame rate.
		let elapsed = 0;
		const rollTime = debugManager.debugActive ? 0.1 : 1;

		return {
			onEnter: () => {
				elapsed = 0;
			},
			onTick: (dt: number) => {
				elapsed += dt;
				if (elapsed >= rollTime) {
					elapsed -= 1;
					if (this.rollEncounter()) {
						// Create Enemy from monster picker
						const enemy = new EnemyCharacter(this.area.pickMonster());
						this.startCombat(enemy);
					}
				}
			},
			onExit: () => {},
		};
	}

	// COMBAT STATE
	private makeCombatState(enemy: EnemyCharacter): StateHandler {
		// fresh CombatManager per fight keeps combat math isolated and stateless

		let combatManager: CombatManager;
		return {
			onEnter: () => {
				combatManager = new CombatManager(Player.getInstance().getPlayerCharacter(), enemy, this.area);
			},
			onTick: (dt: number) => {
				combatManager.onTick(dt);
				if (combatManager.isFinished) {
					// Combat finished - Either goto search again or recovery.
					// Increase stats here
					if (combatManager.playerWon) {
						if (this.state === HuntState.Boss) {
							bus.emit("hunt:bossKill", { areaId: this.area.id });
						}
						this.transition(HuntState.Search, this.makeSearchState());
					} else {
						this.transition(HuntState.Recovery, this.makeRecoveryState());
					}
				}
			},
			onExit: () => {
				if (!combatManager.isFinished) {
					combatManager.endCombatEarly();
				}
			},
		};
	}

	// RECOVERY STATE
	private makeRecoveryState(): StateHandler {
		return {
			onEnter: () => {},
			onTick: (dt: number) => {
				Player.getInstance().getPlayerCharacter().healInRecovery();
				if (Player.getInstance().getPlayerCharacter().isAtMaxHp()) {
					this.transition(HuntState.Search, this.makeSearchState());
				}
			},
			onExit: () => {},
		};
	}
	save(): HuntSaveState {
		const areaSelector = document.getElementById("area-select")! as HTMLSelectElement;

		return {
			huntState: this.state,
			areaId: this.area ? this.area.id : "null",
			areaIndex: areaSelector.selectedIndex,
		};
	}

	load(state: HuntSaveState): void {
		if (state.areaId !== "null") {
			// Only setup if player was in an area
			this.state = state?.huntState;
			this.setArea(state?.areaId);
			this.areaIndex = state?.areaIndex;
		}
	}

	// ────────────────────────────────────────────────────────────────────────────
	//  Helpers
	// ────────────────────────────────────────────────────────────────────────────

	private transition(newState: HuntState, newHandler: StateHandler) {
		this.handler.onExit();
		this.state = newState;
		this.handler = newHandler;
		this.handler.onEnter();
		bus.emit("hunt:stateChanged", this.state);
	}

	private startCombat(enemy: EnemyCharacter) {
		this.transition(HuntState.Combat, this.makeCombatState(enemy));
	}

	private rollEncounter(): boolean {
		const BASE_CHANCE = debugManager.debugActive ? 1 : 0.5;
		return Math.random() < BASE_CHANCE;
	}

	public fightBoss() {
		if (this.state === HuntState.Boss) return;
		printLog("Cannot start boss fight: already in combat.", 2, "HuntManager.ts");
		const enemy = new EnemyCharacter(this.area.pickBoss());
		this.transition(HuntState.Boss, this.makeCombatState(enemy));
	}
}
