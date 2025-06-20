import { debugManager, printLog } from "@/core/DebugManager";
import { Ability } from "./Ability";
import { BoundedNumber } from "./value-objects/Bounded";
import { RegenPool } from "./value-objects/RegenPool";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { RegenPool } from "./value-objects/RegenPool";
import type { StatsProvider } from "@/models/Stats";
import { Destroyable } from "../core/Destroyable";
import { AbilityModifier, EffectInstance, EffectSpec } from "@/shared/types";
import { calculateRawBaseDamage } from "@/shared/utils/stat-utils";

export interface CharacterSnapshot {
	name: string;
	realHP: { current: string; max: string; percent: string };
	stamina: { current: string; max: string; percent: string };
	attack: string;
	defence: string;
	imgUrl: string;
	abilities: Ability[];
	rarity?: string;
	level: { lvl: number; current: number; next: number };
}

export interface PowerLevel {
	attack: string;
	defence: string;
}

export abstract class BaseCharacter extends Destroyable {
	/* ──────────────────────── constants ──────────────────────── */

	/* ────────────────── public readonly fields ───────────────── */
	public readonly hp: BoundedNumber;
	public readonly stamina: RegenPool;

	/* ───────────────────── protected fields ──────────────────── */

	protected abilityMap: Map<string, Ability> = new Map();
	protected abilityModifiers: Map<string, AbilityModifier[]> = new Map();
	protected target?: BaseCharacter;
	protected _charLevel: number = 1;
	protected _type: "PLAYER" | "ENEMY";

	/* ───────────────────── private fields ────────────────────── */
	private inCombat = false;

	/* ───────────────────── debug fields ────────────────────── */
	public canAttack = true;
	public canTakeDamage = true;
	public canDie = true;

	/* ────────────────────── constructor ──────────────────────── */
	constructor(public readonly name: string, public readonly stats: StatsProvider, protected readonly defaultAbilityIds: string[] = []) {
		super();
		this._type = "PLAYER";
		this.defaultAbilityIds.push("basic_melee");
		this.hp = new BoundedNumber(0, this.calcRealHp(this.stats.get("hp")), this.calcRealHp(this.stats.get("hp"))); // TODO - ADD CALCULATIONS TO GET 'REAL' HP FROM MULTIPLIERS
		this.stamina = new RegenPool(GAME_BALANCE.player.stamina.baseMax, GAME_BALANCE.player.stamina.regenPerSecond, true, false);
	}

	private calcRealHp(base: number): number {
		return base;
	}

	calculatePowerStats(): number {
		// 1) Base weights
		const ATTACK_WEIGHT = 1.2;
		const DEFENCE_WEIGHT = 1.0;
		const HP_WEIGHT = 0.8;

		const powerStats = this.stats.get("attack") * ATTACK_WEIGHT + this.stats.get("defence") * DEFENCE_WEIGHT + this.hp.max * HP_WEIGHT;
		return powerStats;
	}

	/* ───────────────────── getters (read-only) ───────────────── */

	get type(): "PLAYER" | "ENEMY" {
		return this._type;
	}
	get currentHp() {
		return this.hp.current;
	}
	get maxHp() {
		return this.hp.max;
	}
	get currentStamina() {
		return this.stamina.current;
	}
	get maxStamina() {
		return this.stamina.max;
	}
	get attack() {
		return this.stats.get("attack");
	}
	get defence() {
		return this.stats.get("defence");
	}
	get speed() {
		return this.stats.get("speed");
	}

	get level(): number {
		return this._charLevel;
	}

	isAlive(): boolean {
		return !this.hp.isEmpty();
	}

	isAtMaxHp(): boolean {
		return this.hp.isFull();
	}

	setToMaxHP() {
		this.hp.setToMax();
	}

	spendStamina(amount: number): boolean {
		if (this.stamina.current < amount) return false;
		this.stamina.spend(amount);
		return true;
	}

	regenStamina(dt: number) {
		this.stamina.regen(dt);
	}

	protected getAvatarUrl(): string {
		return "";
	}

	getPowerLevel(): PowerLevel {
		return {
			attack: this.calcPower().toString(),
			defence: this.stats.get("defence").toString(),
		};
	}

	private calcPower(): number {
		const attack = this.stats.get("attack");
		const powerMultiplier = 1 + this.stats.get("power") / 100;
		const critChance = this.stats.get("critChance") / 100 + 1;
		const critDamage = this.stats.get("critDamage") / 100 + 1;

		return Math.floor(attack * powerMultiplier * critChance * critDamage);
	}

	public addAbilityModifier(abilityId: string, modifier: AbilityModifier) {
		const existing = this.abilityModifiers.get(abilityId) || [];
		this.abilityModifiers.set(abilityId, [...existing, modifier]);
	}

	public getAllAbilityModifiersFromAbility(abilityId: string): AbilityModifier[] {
		return this.abilityModifiers.get(abilityId) || [];
	}

	/* ───────────────────── combat lifecycle ──────────────────── */

	public beginCombat() {
		//this.setToMaxHP();
		this.inCombat = true;
		this.stamina.setCurrent(this.stamina.max);
		this.getAbilities().forEach((a) => a.init()); // Init abilities
	}

	public endCombat() {
		this.inCombat = false;
		this.target = undefined;
	}

	public getAbilities(): Ability[] {
		return Array.from(this.abilityMap.values());
	}

	/* 	protected updateAbilities(newAbilityIds: string[]) {
		for (const id of Array.from(this.abilityMap.keys())) {
			if (!newAbilityIds.includes(id)) {
				this.abilityMap.delete(id);
			}
		}

		for (const id of newAbilityIds) {
			if (!this.abilityMap.has(id)) {
				this.abilityMap.set(id, Ability.create(id));
			}
		}
	} */

	public addNewAbility(abilityId: string) {
		if (!this.abilityMap.has(abilityId)) {
			this.abilityMap.set(abilityId, Ability.createNew(abilityId));
		}
	}

	public getAbility(abilityId: string): Ability | undefined {
		return this.abilityMap.get(abilityId);
	}

	// Each tick
	// Loop through abilities, tick time down.
	// If ready, create instance from Spec and submit it back to Combat Manager for Effect Processing.
	// Note: Called from Combat Manager - Listened for on tick
	public getReadyEffects(dt: number): EffectInstance[] {
		const readyEffects: EffectInstance[] = [];

		if (!this.inCombat || !this.canAttack) return readyEffects;

		this.regenStamina(dt);
		const abilities = this.getAbilities()
			.filter((a) => a.enabled)
			.sort((a, b) => a.priority - b.priority);

		abilities.forEach((ability) => ability.reduceCooldown(dt));

		abilities.forEach((ability) => {
			if (ability.isReady() && this.spendStamina(ability.spec.staminaCost)) {
				for (const effectSpec of ability.spec.effects) {
					const raw: number = this.calculateRawValue(effectSpec);
					readyEffects.push({
						source: this,
						abilityId: ability.id,
						target: effectSpec.target,
						type: effectSpec.type,
						rawValue: raw,
						durationSeconds: effectSpec.durationSeconds,
						statKey: effectSpec.statKey,
					});
				}
				ability.resetCooldown();
				printLog(`${this.name} using ability ${ability.id}`, 3, "BaseCharacter.ts", "combat");
			}
		});
		return readyEffects;
	}

	/** Helper: roll crit/variance, apply power multipliers, etc. */
	private calculateRawValue(effectDef: EffectSpec): number {
		const baseDamage = calculateRawBaseDamage(this);
		const critChance = this.stats.get("critChance") / 100;
		const critDamage = this.stats.get("critDamage") / 100;
		const rolledCrit = Math.random() < critChance;
		const critMultiplier = rolledCrit ? 1 + critDamage : 1;
		const variance = 0.9 + Math.random() * 0.2;

		// for a damage effect: attack × power × crit × variance × effect.scale
		//const totalMultiplier = powerMultiplier * critMultiplier * variance * (effectDef.scale ?? 1);
		const totalDamage = baseDamage * critMultiplier * variance * (effectDef.scale ?? 1);
		return totalDamage;
	}

	// HELPER CLASSES
	snapshot(): CharacterSnapshot {
		return {
			name: this.name,
			realHP: { current: this.currentHp.toString(), max: this.maxHp.toString(), percent: this.hp.percent.toString() },
			stamina: {
				current: this.stamina.current.toFixed(0),
				max: this.stamina.max.toFixed(0),
				percent: (this.stamina.current / this.stamina.max).toFixed(2),
			},
			attack: this.attack.toString(),
			defence: this.defence.toString(),
			abilities: this.getAbilities(),
			imgUrl: this.getAvatarUrl(),
			rarity: "Todo",
			level: { lvl: this._charLevel, current: 0, next: 0 },
		};
	}
}
