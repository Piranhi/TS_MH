import { debugManager, printLog } from "@/core/DebugManager";
import { Ability } from "./Ability";
import { BoundedBig } from "./value-objects/Bounded";
import type { Stats, StatsProvider } from "@/models/Stats";
import { BigNumber } from "./utils/BigNumber";
import { Destroyable } from "./Destroyable";
import { CombatManager } from "@/features/hunt/CombatManager";
import { EffectInstance, EffectSpec } from "@/shared/types";

export interface CharacterSnapsnot {
	name: string;
	realHP: { current: string; max: string; percent: string };
	attack: string;
	defence: string;
	imgUrl: string;
	abilities: Ability[];
	rarity?: string;
}

export abstract class BaseCharacter extends Destroyable {
	/* ──────────────────────── constants ──────────────────────── */

	/* ────────────────── public readonly fields ───────────────── */
	public readonly hp: BoundedBig;
	/* ───────────────────── protected fields ──────────────────── */

	protected abilityMap: Map<string, Ability> = new Map();
	protected target?: BaseCharacter;
	protected combatManager!: CombatManager;

	/* ───────────────────── private fields ────────────────────── */
	private inCombat = false;
	/* ───────────────────── debug fields ────────────────────── */
	public canAttack = true;
	public canTakeDamage = true;
	public canDie = true;

	/* ────────────────────── constructor ──────────────────────── */
	constructor(public readonly name: string, public readonly stats: StatsProvider, protected readonly defaultAbilityIds: string[] = []) {
		super();
		this.defaultAbilityIds.push("basic_melee");
		this.hp = new BoundedBig(this.calcRealHp(this.stats.get("hp")), this.calcRealHp(this.stats.get("hp"))); // TODO - ADD CALCULATIONS TO GET 'REAL' HP FROM MULTIPLIERS
	}

	private calcRealHp(base: number): BigNumber {
		return new BigNumber(base);
	}

	/* ───────────────────── getters (read-only) ───────────────── */

	get currentHp() {
		return this.hp.current;
	}
	get maxHp() {
		return this.hp.max;
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

	isAlive(): boolean {
		return !this.hp.isEmpty();
	}

	isAtMaxHp(): boolean {
		return this.hp.isFull();
	}

	setToMaxHP() {
		this.hp.setToMax();
	}

	protected getAvatarUrl(): string {
		return "";
	}

	/* ───────────────────── combat lifecycle ──────────────────── */

	public beginCombat(combatManager: CombatManager) {
		this.setToMaxHP();
		this.combatManager = combatManager;
		this.inCombat = true;
		this.getActiveAbilities().forEach((a) => a.init()); // Init abilities
	}

	public endCombat() {
		this.inCombat = false;
		this.target = undefined;
	}

	public getActiveAbilities(): Ability[] {
		return Array.from(this.abilityMap.values());
	}

	protected updateAbilities(newAbilityIds: string[]) {
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
	}

	// Each tick
	// Loop through abilities, tick time down.
	// If ready, create instance from Spec and submit it back to Combat Manager for Effect Processing.
	public getReadyEffects(dt: number): EffectInstance[] {
		const readyEffects: EffectInstance[] = [];

		if (!this.inCombat || !this.canAttack) return readyEffects;

		this.getActiveAbilities().forEach((ability) => {
			ability.reduceCooldown(debugManager.debugActive ? debugManager.DEBUG_CHARACTER_ABILITY_CD : dt); // TODO (multiply by speed)
			if (ability.isReady()) {
				for (const effectSpec of ability.spec.effects) {
					const raw: BigNumber = this.calculateRawValue(effectSpec);
					readyEffects.push({
						source: this,
						target: effectSpec.target,
						type: effectSpec.type,
						rawValue: raw,
						durationSeconds: effectSpec.durationSeconds,
						statKey: effectSpec.statKey,
					});
				}
				ability.resetCooldown();
			}
		});
		return readyEffects;
	}

	/** Helper: roll crit/variance, apply power multipliers, etc. */
	private calculateRawValue(effectDef: EffectSpec): BigNumber {
		const attack = new BigNumber(this.stats.get("attack"));
		const powerMultiplier = 1 + this.stats.get("power") / 100;
		const critChance = this.stats.get("critChance") / 100;
		const critDamage = this.stats.get("critDamage") / 100;
		const rolledCrit = Math.random() < critChance;
		const critMultiplier = rolledCrit ? 1 + critDamage : 1;
		const variance = 0.9 + Math.random() * 0.2;

		// for a damage effect: attack × power × crit × variance × effect.scale
		const totalMultiplier = powerMultiplier * critMultiplier * variance * (effectDef.scale ?? 1);
		return attack.multiply(totalMultiplier);
	}

	// HELPER CLASSES
	snapshot(): CharacterSnapsnot {
		return {
			name: this.name,
			realHP: { current: this.currentHp.toString(), max: this.maxHp.toString(), percent: this.hp.percent.toString() },
			attack: this.attack.toString(),
			defence: this.defence.toString(),
			abilities: this.getActiveAbilities(),
			imgUrl: this.getAvatarUrl(),
			rarity: "Todo",
		};
	}
}
