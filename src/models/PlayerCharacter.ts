import { BaseCharacter, CharacterSnapshot } from "./BaseCharacter";
import { StatsEngine } from "@/core/StatsEngine";
import { bus } from "@/core/EventBus";
import { PrestigeState } from "@/shared/stats-types";
import { bindEvent } from "@/shared/utils/busUtils";
import { Saveable } from "@/shared/storage-types";
import { BalanceCalculators, GAME_BALANCE } from "@/balance/GameBalance";
import { Trait } from "./Trait";
import { Ability, AbilitySaveState } from "./Ability";
import { RegenPool } from "./value-objects/RegenPool";

interface playerCharSaveState {
        charLevel: number;
        abilityStates: AbilitySaveState[];
        stamina: RegenPool;
}

export class PlayerCharacter extends BaseCharacter implements Saveable {
	readonly statsEngine: StatsEngine;
	private traits: Trait[];

	private passiveHealTick = 0;
	//private classAbilityIds: string[] = [];

	private _currentXp = 0;
	private _nextXpThreshold = 10;

	constructor(prestigeStats: PrestigeState, traits: Trait[]) {
		const engine = new StatsEngine();
		super("You", { get: (k) => engine.get(k) });
		this.traits = traits;
		bindEvent(this.eventBindings, "player:statsChanged", () => this.updateStats());
		this.statsEngine = engine;

		/* pre‑register empty layers */
		this.calcLevelBonuses(); // Add stat bonuses for level
		this.statsEngine.setLayer("prestige", () => ({
			attack: prestigeStats.permanentAttack,
			defence: prestigeStats.permanentDefence,
			hp: prestigeStats.permanentHP,
		}));
		this.statsEngine.setLayer("equipment", () => ({}));
		this.statsEngine.setLayer("trainedStats", () => ({}));
		this.statsEngine.setLayer("classes", () => ({}));
		this.statsEngine.setLayer("buffs", () => ({}));

		bindEvent(this.eventBindings, "Game:GameTick", () => this.passiveHeal());

		//bindEvent(this.eventBindings, "hunt:XPearned", (amt) => this.gainXp(amt));
	}

	public init() {
		//this.defaultAbilityIds.push("basic_heal");
		//this.recalculateAbilities();
		this.addNewAbility("basic_melee");
		bus.emit("player:statsChanged");
	}

	private passiveHeal() {
		this.passiveHealTick++;

		this.hp.increase(GAME_BALANCE.player.healing.passiveHealAmount);
	}

	healInRecovery() {
		this.hp.increase(this.maxHp * GAME_BALANCE.player.healing.recoveryStateHeal); // Always heal at least 1
	}

	private updateStats() {
		this.hp.max = this.stats.get("hp");
	}

	public gainXp(amt: number) {
		this._currentXp += amt;
		let levelledUp = false;

		while (this._currentXp >= this._nextXpThreshold) {
			this.levelUp();
			levelledUp = true;

			this._currentXp -= this._nextXpThreshold;

			const newThreshold = Math.floor(this._nextXpThreshold * GAME_BALANCE.player.xpThresholdMultiplier);
			this._nextXpThreshold = newThreshold;
		}

		if (levelledUp) {
			this.calcLevelBonuses();
			bus.emit("char:levelUp", this._charLevel);
		}
		bus.emit("char:gainedXp", amt);
	}

	public levelUp() {
		this._charLevel++;
	}

	private calcLevelBonuses() {
		// Use centralized calculator
		const bonuses = BalanceCalculators.getAllPlayerLevelBonuses(this._charLevel);
		this.statsEngine.setLayer("level", () => bonuses);
	}

	// ----------------------------- ABILITIES --------------------------------

	/** Recalculate full ability set and update map */
	/* 	private recalculateAbilities() {
		// Merge all sources (dedupe with Set)
		const mergedIds = Array.from(
			new Set([
				...(this.defaultAbilityIds ?? []),
				...this.classAbilityIds,
				// ...add more here if needed
			])
		);
		this.updateAbilities(mergedIds);
	} */

	get level(): number {
		return this._charLevel;
	}

	get currentXp(): number {
		return this._currentXp;
	}

	get nextXpThreshold(): number {
		return this._nextXpThreshold;
	}

	override getAvatarUrl(): string {
		return "/images/player/player-avatar-01.png";
	}

        override snapshot(): CharacterSnapshot {
                return {
                        name: this.name,
                        realHP: { current: this.currentHp.toString(), max: this.maxHp.toString(), percent: this.hp.percent.toString() },
                        stamina: { current: this.stamina.current.toFixed(0), max: this.stamina.max.toFixed(0), percent: (this.stamina.current / this.stamina.max).toFixed(2) },
                        attack: this.attack.toString(),
                        defence: this.defence.toString(),
                        abilities: this.getAbilities(),
                        imgUrl: this.getAvatarUrl(),
                        rarity: "Todo",
			level: { lvl: this._charLevel, current: this._currentXp, next: this._nextXpThreshold },
		};
	}

        save(): playerCharSaveState {
                return {
                        charLevel: this._charLevel,
                        abilityStates: this.getAbilities().map((a) => a.save()), // Call save() on each ability
                        stamina: this.stamina,
                };
        }

        load(state: playerCharSaveState): void {
                this._charLevel = state.charLevel;
                this.abilityMap.clear();
                this.stamina.setMax(state.stamina.max);
                this.stamina.setCurrent(state.stamina.current);

		for (const abilityState of state.abilityStates) {
			const ability = Ability.createFromSaveState(abilityState);
			this.abilityMap.set(ability.id, ability);
		}
	}

	public getTraits(): Trait[] {
		return this.traits;
	}
}
