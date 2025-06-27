import { debugManager, printLog } from "@/core/DebugManager";
import { Ability } from "./Ability";
import { BoundedNumber } from "./value-objects/Bounded";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { RegenPool } from "./value-objects/RegenPool";
import type { StatsProvider } from "@/models/Stats";
import { Destroyable } from "../core/Destroyable";
import { AbilityModifier, Affinity, EffectInstance, EffectSpec } from "@/shared/types";
import { calculateRawBaseDamage } from "@/shared/utils/stat-utils";
import { CharacterResistances } from "../features/hunt/CharacterResistances";
import { StatusEffectManager } from "@/features/hunt/StatusEffectManager";
import { StatusEffect } from "@/features/hunt/StatusEffect";

export interface CharacterSnapshot {
	name: string;
	hpCurrent: number;
	hpMax: number;
	staminaCurrent: number;
	staminaMax: number;
	attack: number;
	defence: number;
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
	protected _type: "PLAYER" | "ENEMY" = "PLAYER";

	/* ───────────────────── private fields ────────────────────── */
	private inCombat = false;
	private _alive = true;
	public readonly resistances: CharacterResistances;
	public readonly statusEffects: StatusEffectManager;

	/* ───────────────────── debug fields ────────────────────── */
	public canAttack = true;
	public canTakeDamage = true;
	public canDie = true;

	/* ────────────────────── constructor ──────────────────────── */
	constructor(public readonly name: string, public readonly stats: StatsProvider, protected affinities: Affinity[] = []) {
		super();
		this.resistances = new CharacterResistances();
		this.statusEffects = new StatusEffectManager();
		this.hp = new BoundedNumber(0, this.calcRealHp(this.stats.get("hp")), this.calcRealHp(this.stats.get("hp"))); // TODO - ADD CALCULATIONS TO GET 'REAL' HP FROM MULTIPLIERS
		this.stamina = new RegenPool(GAME_BALANCE.player.stamina.baseMax, GAME_BALANCE.player.stamina.regenPerSecond, true, false);
	}

	private calcRealHp(base: number): number {
		return base;
	}

	protected checkDebugOptions() {}

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

	get alive(): boolean {
		return this._alive;
	}

	set alive(alive: boolean) {
		this._alive = alive;
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

	hasStamina(amount: number): boolean {
		return this.stamina.current >= amount;
	}

	spendStamina(amount: number): boolean {
		if (!this.hasStamina(amount)) return false;
		this.stamina.spendAllocation(amount);
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
		this.alive = true;
		this.stamina.setCurrent(this.stamina.max);
		this.getAbilities().forEach((a) => a.init()); // Init abilities
		this.resistances.clearTemp();
		this.statusEffects.clear();
	}

	public endCombat() {
		this.inCombat = false;
		this.target = undefined;
		this.resistances.clearTemp();
		this.statusEffects.clear();
	}

	public addStatusEffect(effect: StatusEffect) {
		this.statusEffects.add(effect);
	}

	public getAbilities(): Ability[] {
		return Array.from(this.abilityMap.values());
	}

	public addNewAbility(abilityId: string) {
		if (!this.abilityMap.has(abilityId)) {
			this.abilityMap.set(abilityId, Ability.createNew(abilityId));
		}
	}

	public getAbility(abilityId: string): Ability | undefined {
		return this.abilityMap.get(abilityId);
	}

	public handleCombatUpdate(dt: number) {
		this.checkDebugOptions();
		this.statusEffects.handleTick(dt);
		this.regenStamina(dt);
	}

	// Returns a list of abilities that are ready to be used
	public getReadyAbilities(dt: number): Ability[] {
		if (!this.inCombat || !this.canAttack) return [];

		const abilities = this.getAbilities()
			.filter((a) => a.enabled)
			.sort((a, b) => a.priority - b.priority);

		abilities.forEach((ability) => ability.reduceCooldown(dt));
		return abilities.filter((ability) => ability.isReady() && this.hasStamina(ability.spec.staminaCost));
	}

	public createEffectInstance(ability: Ability): EffectInstance[] {
		const readyEffects: EffectInstance[] = [];
		for (const effectSpec of ability.spec.effects) {
			const raw: number = this.calculateRawValue(effectSpec);
			readyEffects.push({
				source: this,
				abilityId: ability.id,
				effectId: effectSpec.effectId,
				target: effectSpec.target,
				element: ability.spec.element,
				type: effectSpec.type,
				rawValue: raw,
				durationSeconds: effectSpec.durationSeconds,
				statKey: effectSpec.statKey,
			});
		}
		this.spendStamina(ability.spec.staminaCost);
		ability.resetCooldown();
		return readyEffects;
	}

	/** Helper: roll crit/variance, apply power multipliers, etc. */
	private calculateRawValue(effect: EffectSpec): number {
		const baseDamage = calculateRawBaseDamage(this);
		const critChance = this.stats.get("critChance") / 100;
		const critDamage = this.stats.get("critDamage") / 100;
		const rolledCrit = Math.random() < critChance;
		const critMultiplier = rolledCrit ? 1 + critDamage : 1;
		const variance = 0.9 + Math.random() * 0.2;

		// for a damage effect: attack × power × crit × variance × effect.scale
		//const totalMultiplier = powerMultiplier * critMultiplier * variance * (effectDef.scale ?? 1);
		const totalDamage = baseDamage * critMultiplier * variance * (effect.scale ?? 1);
		return totalDamage;
	}

	// HELPER CLASSES
	snapshot(): CharacterSnapshot {
		return {
			name: this.name,
			hpCurrent: this.currentHp,
			hpMax: this.maxHp,
			staminaCurrent: this.stamina.current,
			staminaMax: this.stamina.max,
			attack: this.attack,
			defence: this.defence,
			abilities: this.getAbilities(),
			imgUrl: this.getAvatarUrl(),
			rarity: "Todo",
			level: { lvl: this._charLevel, current: 0, next: 0 },
		};
	}
}
