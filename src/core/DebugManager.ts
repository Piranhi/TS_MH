const PRINT_VERBOSITY = 2;

export class DebugManager {
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
