import { debugManager, printLog } from "@/core/DebugManager";
import { Ability, AbilityPriority } from "./Ability";
import { BoundedBig, BoundedNumber } from "./value-objects/Bounded";
import { bus } from "@/core/EventBus";
import type { CoreStats } from "@/models/Stats";
import { BigNumber } from "./utils/BigNumber";

export interface CharacterSnapsnot {
	name: string;
	level: number;
	hp: { current: string; max: string; percent: string };
	attack: string;
	defence: string;
	avatarUrl: string;
	abilities: Ability[];
	rarity?: string;
}

export abstract class BaseCharacter {
	/* ──────────────────────── constants ──────────────────────── */

	/* ────────────────── public readonly fields ───────────────── */
	public readonly name: string;
	public readonly level: number;

	/* ───────────────────── protected fields ──────────────────── */
	protected readonly stats: CoreStats; // FINAL BIGNUMBER STATS
	protected readonly hp: BoundedBig;
	protected defaultAbilityIds: string[] = [];
	protected abilityMap: Map<string, Ability> = new Map();

	protected target?: BaseCharacter;

	/* ───────────────────── private fields ────────────────────── */
	private inCombat = false;
	private readonly onTick = (dt: number) => this.handleTick(dt);

	/* ────────────────────── constructor ──────────────────────── */
	constructor(name: string, level: number, stats: CoreStats, defaultAbilities: string[] = []) {
		this.name = name;
		this.level = level;
		this.stats = stats;
		this.defaultAbilityIds = defaultAbilities;
		this.defaultAbilityIds.push("basic_melee");

		// HP STARTS FULL
		this.hp = new BoundedBig(this.stats.hp, this.stats.hp);
		bus.on("Game:GameTick", this.onTick);
	}

	/** Apply incoming damage after defence mitigation. */
	takeDamage(raw: BigNumber): void {
		const net = raw.subtractNonNegative(this.defence);
		if (net.lte(new BigNumber(0))) return; // blocked
		this.hp.decrease(net);
		printLog(
			`${this.name} taking damage. Inc: [RAW]${raw.toString()} - [DEF]${this.defence.toString()} - [NET]${net.toString()}}`,
			3,
			"BaseCharacter.ts"
		);
	}

	/** Heal by a positive amount (clamped in BoundedBig). */
	heal(amount: BigNumber): void {
		if (amount.lte(new BigNumber(0))) return;
		this.hp.increase(amount);
		printLog(`${this.name} healing. Inc: ${amount}`, 3, "BaseCharacter.ts");
	}

	isAlive(): boolean {
		return !this.hp.isEmpty();
	}

	isAtMaxHp(): boolean {
		return this.hp.isFull();
	}

	/** Final damage dealt for an ability: base.attack × ability scalar (or + etc.). */
	public calculateAbilityDamage(abilityDamage: number): BigNumber {
		return this.stats.attack.add(abilityDamage);
	}

	/* ───────────────────── getters (read-only) ───────────────── */

	get currentHp() {
		return this.hp.current;
	}
	get maxHp() {
		return this.hp.max;
	}
	get attack() {
		return this.stats.attack;
	}
	get defence() {
		return this.stats.defence;
	}
	get speed() {
		return this.stats.speed;
	}
	/*    public getAbilities() {
        return this.abilities;
    } */

	/* ───────────────────── combat lifecycle ──────────────────── */

	public beginCombat(target: BaseCharacter) {
		this.target = target;
		this.inCombat = true;
		this.getActiveAbilities().forEach((a) => a.init()); // Init abilities
	}

	public endCombat() {
		this.inCombat = false;
		this.target = undefined;
	}

	public destroy() {
		bus.off("Game:GameTick", this.onTick);
	}

	public handleTick(dt: number): void {
		if (!this.inCombat || !this.target) return;

		this.getActiveAbilities().forEach((ability) => {
			ability.reduceCooldown(debugManager.debugActive ? 0.5 : dt); // TODO (multiply by speed)
			if (ability.isReady()) ability.perform(this, this.target!);
		});
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

	// HELPER CLASSES
	snapshot(): CharacterSnapsnot {
		return {
			name: this.name,
			level: this.level,
			hp: { current: this.currentHp.toString(), max: this.maxHp.toString(), percent: this.hp.percent.toString() },
			attack: this.attack.toString(),
			defence: this.defence.toString(),
			abilities: this.getActiveAbilities(),
			avatarUrl: "Todo",
			rarity: "Todo",
		};
	}
}
