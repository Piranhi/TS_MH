const PRINT_VERBOSITY = 3;
export type DebugType = "combat" | "settlement" | "player";
// Define all possible debug options and their types
type DebugOptions = {
	player_abilityCD: number;
	enemy_canAttack: boolean;
	enemy_canTakeDamage: boolean;
	enemy_canDie: boolean;
	hunt_searchSpeed: number;
	hunt_allAreasOpen: boolean;
};
export class DebugManager {
	public readonly printDebug = false;
	public debugEnabled = true;
	private defaults: DebugOptions;
	private overrides: Partial<DebugOptions>;

	public readonly DEBUG_HUNT_SEARCHSPEED = 0.1;
	public readonly DEBUG_CHARACTER_ABILITY_CD = 0.1;
	public readonly enemyCanAttack: boolean = true;
	public readonly enemyCanTakeDamage: boolean = true;
	public readonly enemyCanDie: boolean = false;
	public readonly activeTypes = new Set<DebugType>(["combat"]);

	constructor(
		defaults: DebugOptions = {
			player_abilityCD: 1,
			enemy_canAttack: true,
			enemy_canTakeDamage: true,
			enemy_canDie: true,
			hunt_searchSpeed: 1,
			hunt_allAreasOpen: false,
		},
		overrides: Partial<DebugOptions> = {
			hunt_allAreasOpen: true,
			hunt_searchSpeed: 0.1,
		}
	) {
		this.defaults = defaults;
		this.overrides = overrides;
	}

	// Get either the override (when enabled) or the default value
	public get<K extends keyof DebugOptions>(key: K): DebugOptions[K] {
		if (this.debugEnabled && key in this.overrides) {
			return this.overrides[key] as DebugOptions[K];
		}
		return this.defaults[key];
	}

	public setEnabled(enabled: boolean): void {
		this.debugEnabled = enabled;
	}
}

export function printLog(msg: string, verbosity: number, sender?: string, type?: DebugType) {
	if (verbosity <= PRINT_VERBOSITY) {
		if (type) {
			if (!debugManager.activeTypes.has(type)) return;
		}
		let output: string = "";
		if (sender !== null) {
			output = `[${sender}] `;
		}
		console.log(`${output} ${msg}`);
	}
}

export const debugManager = new DebugManager();
