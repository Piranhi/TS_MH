const PRINT_VERBOSITY = 3;

export class DebugManager {}

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
