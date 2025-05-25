export interface Saveable<TState = unknown> {
	save(): TState;

	load(state: TState): void;
}

//export type GameSave = Record<string, unknown>;
// In storage-types.ts
export interface GameSave {
	_version: number;
	_timestamp: number;
	_lastActiveTime: number; // Add this
	[key: string]: unknown;
}
