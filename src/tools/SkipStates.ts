export interface SkipState {
  id: number;
  description: string;
  apply(context: import('../core/GameContext').GameContext): void;
}

export const skipStates: SkipState[] = [];

export function registerSkipState(state: SkipState) {
  skipStates[state.id] = state;
}

export function applySkipState(level: number, context: import('../core/GameContext').GameContext) {
  for (let i = 0; i <= level && i < skipStates.length; i++) {
    const state = skipStates[i];
    if (state) state.apply(context);
  }
}
