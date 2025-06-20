import { Player } from "./Player";
import { HuntState } from "../features/hunt/HuntManager";
import { PlayerCharacter } from "../models/PlayerCharacter";
import { EnemyCharacter } from "../models/EnemyCharacter";
import { poolChangedPayload } from "../models/value-objects/RegenPool";
import { InventoryItemSpec } from "../shared/types";
import { AreaStats, EnemyStats, GameStats, PrestigeStats, UserStats } from "@/shared/stats-types";
import { MilestoneEventPayload } from "@/shared/Milestones";
import { GameRun, RunStats } from "./GameRun";
import { Resource } from "@/features/inventory/Resource";
import { ModifierSystem } from "./ModifierEngine";

export interface GameEvents {
	"Game:UITick": number;
	"Game:GameTick": number;
	"game:init": void;
	"game:newGame": void;
	"game:gameReady": void;
	"game:gameLoaded": void;
	"game:gameSaved": void;
	"game:prestigePrep": void;
	"game:prestige": void;
	"game:systemsPaused": void;
	"game:systemsResumed": void;

	"ui:screenChanged": string;
	"renown:changed": number;
	"renown:award": number;

	// MODIFIERS
	"modifier:recalculated": void;
	"modifier:changed": ModifierSystem | null;

	// RESOURCES
	"resources:changed": Resource;

	// MINE
	"mine:opened": { index: number; rewards: Record<string, number> };

	// LIBRARY
	"library:changed": void;

	// BLACKSMITH
	"blacksmith:slots-changed": void;
	"blacksmith:upgrades-changed": void;
	"blacksmith:changed": void;

	// PLAYER
	"player:initialized": Player;
	"player:level-up": number;
	"player:stamina-changed": poolChangedPayload;
	"player:trainedStatChanged": string;
	"player:equipmentChanged": InventoryItemSpec[];
	"player:classCardsChanged": InventoryItemSpec[];
	"player:statsChanged": PlayerCharacter;

	// PLAYER CHARACTER
	"char:levelUp": number; // New Level
	"char:gainedXp": number; // Amount incoming

	//HUNT
	"hunt:stateChanged": HuntState;
	"hunt:areaSelected": string;
	"hunt:areaKill": { enemyId: string; areaId: string };
	"hunt:bossKill": { areaId: string };
	"hunt:areaUnlocked": string;
	"hunt:XPearned": number;

	"combat:started": { player: PlayerCharacter; enemy: EnemyCharacter };
	"combat:ended": string;
	"classCard:levelUp": string;
	"inventory:changed": void;
	"inventory:dropped": string[];
	"slot:drop": { fromId: string; toId: string };
	"slot:drag-start": { slotId: string };
	"slot:click": string;
	"slot:dblclick": string;

	"settlement:changed": void;
	"settlement:buildPointsChanged": number;
	// ----------------- STATS -----------------
	"stats:userStatsChanged": UserStats;
	"stats:enemyStatsChanged": EnemyStats;
	"stats:areaStatsChanged": AreaStats;
	"stats:gameStatsChanged": GameStats;
	"stats:prestigeStatsChanged": PrestigeStats;
	"milestone:achieved": MilestoneEventPayload;
	//------------------ DEBUG ---------------------
	"debug:killEnemy": void;
	// ------------------ GAME RUN ------------------------
	"gameRun:started": GameRun;
	"gameRun:initialized": GameRun;
	"gameRun:ended": RunStats;
	"gameRun:destroyed": string;
}

export type EventKey = keyof GameEvents;

type Listener<E extends EventKey> = (payload: GameEvents[E]) => void;

export class EventBus {
	private listeners = new Map<EventKey, Set<Listener<any>>>();
	private lastValue = new Map<EventKey, unknown>();

	public on<E extends EventKey>(event: E, fn: Listener<E>) {
		if (this.lastValue.has(event)) {
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
