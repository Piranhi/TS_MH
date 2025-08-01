import { GAME_BALANCE } from "@/balance/GameBalance";

const PRINT_VERBOSITY = 2;
export type DebugType = "combat" | "settlement" | "player" | "offline";
// Define all possible debug options and their types
export type DebugOptions = {
	player_overrideAbilityCD: boolean;
	player_canDie: boolean;
	player_canTakeDamage: boolean;
	enemy_canAttack: boolean;
	enemy_canTakeDamage: boolean;
	enemy_canDie: boolean;
	hunt_searchSpeed: number;
	hunt_allAreasOpen: boolean;
	building_infinitePoints: boolean;
	upgrades_unlockAll: boolean;
	upgrades_instantBuild: boolean;
	reseach_unlockAll: boolean;
	research_instantResearch: boolean;
	showcombatstats: boolean;
	rewards_alwaysDropAllLoot: boolean;
};
export class DebugManager {
	public readonly printDebug = false;
	public debugEnabled = true;
	private defaults: DebugOptions;
	private overrides: Partial<DebugOptions>;

	public readonly activeTypes = new Set<DebugType>(["offline"]);
	private readonly STORAGE_KEY = "debug_overrides";

	constructor(
		defaults: DebugOptions = {
			player_overrideAbilityCD: false, // TODO - Setup the player to have instant or fast CD's when this is true;
			player_canDie: true,
			player_canTakeDamage: true,
			enemy_canAttack: true,
			enemy_canTakeDamage: true,
			enemy_canDie: true,
			hunt_searchSpeed: 1,
			hunt_allAreasOpen: false,
			building_infinitePoints: false,
			upgrades_unlockAll: false,
			upgrades_instantBuild: false,
			reseach_unlockAll: false,
			research_instantResearch: false,
			showcombatstats: false,
			rewards_alwaysDropAllLoot: false,
		},
		overrides: Partial<DebugOptions> = {}
	) {
		this.defaults = defaults;
		this.overrides = overrides;
		this.loadFromStorage();
	}

	// Get either the override (when enabled) or the default value
	public get<K extends keyof DebugOptions>(key: K): DebugOptions[K] {
		if (this.debugEnabled && key in this.overrides) {
			return this.overrides[key] as DebugOptions[K];
		}
		return this.defaults[key];
	}

	// Update a debug option override
	public set<K extends keyof DebugOptions>(key: K, value: DebugOptions[K]): void {
		this.overrides[key] = value;
		this.saveToStorage(); // Auto-save on every change
	}

	public setEnabled(enabled: boolean): void {
		this.debugEnabled = enabled;
	}

	// Save current overrides to localStorage
	public saveToStorage(): void {
		if (typeof localStorage === "undefined") return;
		try {
			const dataToSave = JSON.stringify(this.overrides);
			localStorage.setItem(this.STORAGE_KEY, dataToSave);
		} catch (error) {
			console.warn("Failed to save debug settings:", error);
		}
	}

	// Load overrides from localStorage
	public loadFromStorage(): void {
		if (typeof localStorage === "undefined") return;
		try {
			const saved = localStorage.getItem(this.STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as Partial<DebugOptions>;
				this.overrides = { ...this.overrides, ...parsed };
			}
		} catch (error) {
			console.warn("Failed to load debug settings:", error);
		}
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
