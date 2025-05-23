const PRINT_VERBOSITY = 3;
export type DebugType = "combat" | "settlement" | "player";
export class DebugManager {
	public readonly debugActive = false;
	public readonly DEBUG_HUNT_SEARCHSPEED = 0.1;
	public readonly DEBUG_CHARACTER_ABILITY_CD = 0.1;
	public readonly enemyCanAttack: boolean = true;
	public readonly enemyCanTakeDamage: boolean = true;
	public readonly enemyCanDie: boolean = false;
	public readonly activeTypes = new Set<DebugType>(["combat"]);
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
