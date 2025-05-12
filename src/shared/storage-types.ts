export interface Saveable<TState = unknown> {
	save(): TState;

	load(state: TState): void;

}


export type GameSave = Record<string, unknown>;


