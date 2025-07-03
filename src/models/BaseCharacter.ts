import { debugManager, printLog } from "@/core/DebugManager";
import { Ability } from "./Ability";
import { BoundedNumber } from "./value-objects/Bounded";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { RegenPool } from "./value-objects/RegenPool";
import type { StatsProvider } from "@/models/Stats";
import { Destroyable } from "../core/Destroyable";
import { CharacterResistances } from "../features/hunt/CharacterResistances";
import { StatusEffectManager } from "@/features/hunt/StatusEffectManager";
import { bus } from "@/core/EventBus";
import { AbilityModifier, Affinity, ElementType } from "@/shared/types";
import { bindEvent } from "@/shared/utils/busUtils";
import { CombatCalculator } from "@/features/hunt/CombatCalculator";

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
	public hp: BoundedNumber;
	public stamina: RegenPool;

	/* ───────────────────── protected fields ──────────────────── */

	protected abilityMap: Map<string, Ability> = new Map();
	protected abilityModifiers: Map<string, AbilityModifier[]> = new Map();
	protected _charLevel: number = 1;
	protected _type: "PLAYER" | "ENEMY" = "PLAYER";

	/* ───────────────────── private fields ────────────────────── */
	private inCombat = false;
	private _alive = true;
	private periodicStatusTick = 0;
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
		bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleTick(dt));
	}

	// Handle tick - Keep to a minimum
	private handleTick(dt: number) {
		if (!this.alive) return;
		this.reduceAbilityCooldowns(dt);
		this.handleCombatUpdates(dt);
	}

	private handleCombatUpdates(dt: number) {
		this.checkDebugOptions();
		const periodicEffects = this.statusEffects.processPeriodicEffects(dt);

		this.periodicStatusTick += dt;
		if (this.periodicStatusTick >= GAME_BALANCE.combat.periodicTick) {
			this.periodicStatusTick -= GAME_BALANCE.combat.periodicTick;
			for (const effect of periodicEffects) {
				if (effect.type === "damage") {
					const dmg = CombatCalculator.calculatePeriodicDamage(effect.amount, effect.element, this);
					const actual = this.takeDamage(dmg);
					bus.emit("char:hpChanged", { char: this, amount: -actual });
				} else if (effect.type === "heal") {
					const actual = this.heal(effect.amount);
					bus.emit("char:hpChanged", { char: this, amount: actual });
				}
			}
		}
		this.regenStamina(dt);
	}

	private calcRealHp(base: number): number {
		return base;
	}

	public checkDebugOptions() {}

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

	/**
	 * Take damage and return the actual amount taken
	 */
	public takeDamage(amount: number): number {
		if (!this.canTakeDamage) return 0;

		const beforeHp = this.hp.current;
		this.hp.decrease(amount);
		if (this.hp.current <= 0 && this.canDie) {
			this.characterDied();
		} else if (this.hp.current <= 0 && !this.canDie) {
			this.hp.setToMax();
		}
		const actualDamage = beforeHp - this.hp.current;

		return actualDamage;
	}

	private characterDied() {
		this.alive = false;
		this.statusEffects.clear();
	}

	/**
	 * Heal and return the actual amount healed
	 */
	public heal(amount: number): number {
		const beforeHp = this.hp.current;
		this.hp.increase(amount);
		const actualHealing = this.hp.current - beforeHp;

		return actualHealing;
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

	public reduceAbilityCooldowns(dt: number) {
		const abilities = this.getAbilities().filter((a) => a.enabled);

		const baseSpeed = this.stats.get("speed");
		const baseSpeedMultiplier = baseSpeed / 1; // 100 speed = 1.0x, 150 = 1.5x, 50 = 0.5x
		const statusSpeedMultiplier = this.statusEffects.getSpeedModifier();

		// Combine multipliers
		const totalSpeedMultiplier = baseSpeedMultiplier * statusSpeedMultiplier;
		const effectiveDt = dt * totalSpeedMultiplier;

		abilities.forEach((a) => a.reduceCooldown(effectiveDt));
	}

	/* ───────────────────── combat lifecycle ──────────────────── */

	public beginCombat() {
		this.inCombat = true;
		this.alive = true;
		this.stamina.setCurrent(this.stamina.max);
	}

	public endCombat() {
		this.inCombat = false;
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
