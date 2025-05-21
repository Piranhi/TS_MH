const PRINT_VERBOSITY = 2;

export class DebugManager {
	public readonly DEBUG_HUNT_SEARCHSPEED = 0.1;
	public readonly DEBUG_CHARACTER_ABILITY_CD = 1;
	public readonly debugActive: boolean = true;
}

export function printLog(msg: string, verbosity: number, sender?: string) {
	if (verbosity <= PRINT_VERBOSITY) {
		let output: string = "";
		if (sender !== null) {
			output = `[${sender}] `;
		}
		console.log(`${output} ${msg}`);
	}
}

export const debugManager = new DebugManager();
