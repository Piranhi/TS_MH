import { Bounded } from "./domain/value-objects/Bounded";
import { Player } from "./player";
import { HuntState } from "./features/hunt/HuntManager";
import { CombatManager } from "./features/hunt/CombatManager";
import { PlayerCharacter } from "./features/Characters/PlayerCharacter";
import { EnemyCharacter } from "./features/Characters/EnemyCharacter";
import { TrainedStat } from "./features/TrainedStat/TrainedStat";
import { poolChangedPayload } from "./domain/value-objects/RegenPool";

export interface GameEvents {
	"Game:UITick": number;
	"Game:GameTick": number;
	"Renown:Changed" : Bounded;
	"Resource:Changed": { gold: number };
	"player:initialized" : Player;
	"player:level-up" : number;
	"player:stamina-changed" : poolChangedPayload;
	"player:trainedStat-changed" : string;
	"hunt:stateChanged": HuntState;
	"hunt:areaSelected": string;
	"combat:started": {player: PlayerCharacter, enemy: EnemyCharacter};
	"combat:ended": string;
	"reward:renown": number;
	"classCard:levelUp" : string;
}

export type EventKey = keyof GameEvents;

type Listener<E extends EventKey> = (payload: GameEvents[E]) => void;

export class EventBus {
	private listeners = new Map<EventKey, Set<Listener<any>>>();
	private lastValue = new Map<EventKey, unknown>();

	public on<E extends EventKey>(event: E, fn: Listener<E>) {
		if(this.lastValue.has(event)){
			fn(this.lastValue.get(event) as GameEvents[E]);
		}
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(fn as Listener<any>);
		return () => this.off(event, fn); // Return an unsubscribe event
	}

	public off<E extends EventKey>(event: E, fn: Listener<E>) {
		this.listeners.get(event)?.delete(fn as Listener<any>);
	}

	emit<E extends EventKey>(event: E): void;
	emit<E extends EventKey>(event: E, payload: GameEvents[E]): void;

	public emit(event: EventKey, payload?: any): void {
		const set = this.listeners.get(event);
		if (!set) return;
		set.forEach((fn) => {
			(fn as any)(payload);
		});
	}
}

export const bus: EventBus = new EventBus();
