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
import { Area } from "@/models/Area";
import { BaseCharacter } from "@/models/BaseCharacter";

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

	//MILESTONES
	"milestone:featureUnlocked": string;

	// UI
	"ui:screenChanged": string;
	"ui:screenUnlocked": void;

	"renown:changed": number;
	"renown:award": number;

	// MODIFIERS
	"modifier:recalculated": void;
	"modifier:changed": ModifierSystem | null;

	// SETTLEMENT
	"settlement:changed": void;
	"settlement:buildPointsChanged": number;
	"settlement:renownChanged": number;
	"settlement:buildingBuilt": { buildingId: string; meta?: any };

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
	"player:energy-changed": { current: number; max: number; allocated: number };
	"player:trainedStatChanged": string;
	"player:equipmentChanged": InventoryItemSpec[];
	"player:classCardsChanged": InventoryItemSpec[];
	"player:statsChanged": PlayerCharacter;
	"player:goldChanged": number;

	// PLAYER CHARACTER
	"char:levelUp": number; // New Level
	"char:XPChanged": number; // Amount incoming
	"char:hpChanged": { char: BaseCharacter; amount: number; isCrit?: boolean };
	"classes:pointsChanged": void;
	"classes:nodesChanged": void;

	//HUNT
	"hunt:stateChanged": HuntState;
	"hunt:areaSelected": string;
	"hunt:areaChanged": Area;
	"hunt:areaKill": { enemyId: string; areaId: string };
	"hunt:bossKill": { areaId: string };
	"hunt:areaUnlocked": string;
	"hunt:XPearned": number;

	"combat:started": { player: PlayerCharacter; enemy: EnemyCharacter };
	"combat:ended": string;
	"combat:postCombatReport": {
		enemy: EnemyCharacter;
		area: Area;
		xp: number;
		loot: string[];
		renown: number;
		gold?: number;
		recruit?: any;
		rewards?: any[];
	};

	"classCard:levelUp": string;
	"inventory:changed": void;
	"inventory:dropped": string[];

	// INVENTORY
	"slot:drop": { fromId: string; toId: string };
	"slot:drag-start": { slotId: string };
	"slot:click": string;
	"slot:ctrlclick": string;
	"slot:dblclick": string;

	"recruits:changed": void;
	"recruit:found": { recruit: any; source: string };

	// REWARDS
	"reward:chestOpened": { tier: number; contents: string[]; source: string };
	"reward:renown": number;
	"reward:xp": number;
	"reward:recruit": { recruit: any; source: string };
	"reward:gold": number;
	"reward:equipment": { itemId: string; quantity: number };
	// ----------------- STATS -----------------
	"stats:userStatsChanged": UserStats;
	"stats:enemyStatsChanged": EnemyStats;
	"stats:areaStatsChanged": AreaStats;
	"stats:gameStatsChanged": GameStats;
	"stats:prestigeStatsChanged": PrestigeStats;
	"milestone:achieved": MilestoneEventPayload;
	//------------------ DEBUG ---------------------
	"debug:killEnemy": void;
	"debug:statsUpdate": { isPlayer: boolean; data: string };
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
	private bShowDebug = false;

	public on<E extends EventKey>(event: E, fn: Listener<E>) {
		// Temp disable - Performance gains
		/* 		if (this.lastValue.has(event)) {
			fn(this.lastValue.get(event) as GameEvents[E]);
		} */
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
		// Save the payload so future listeners can immediately receive it
		this.lastValue.set(event, payload);

		const set = this.listeners.get(event);
		if (!set) return;
		set.forEach((fn) => {
			(fn as any)(payload);
		});

		if (this.bShowDebug) {
			// debug to see count of listeners
			//console.count(event); // See what's spamming
			// Show listener count for problematic events
			if (event === "Game:UITick" || event === "Game:GameTick") {
				console.log(`${event}: ${set.size} listeners`); // This shows the real problem!
			}
		}
	}
}

export const bus: EventBus = new EventBus();
