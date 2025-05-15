import { Attack, AttackPriority } from "./Attack";
import { Bounded } from "./value-objects/Bounded";
import { bus } from "@/core/EventBus";
import type { CoreStats } from "@/models/Stats";

export interface CharacterData<S extends CoreStats = CoreStats> {
	name: string;
	level: number;
	hp: Bounded;
	stats: S;
}
export interface CharacterSnapsnot {
	name: string;
	level: number;
	cooldown: Bounded;
	hp: Bounded;
	attack: number;
	defence: number;
	avatarUrl: string;
	attacks: Attack[];
	rarity?: string;
}

export abstract class BaseCharacter {
	private readonly MAX_COOLDOWN = 300;
	private cooldown: Bounded;
	readonly name: string;
	readonly level: number;
	protected readonly base: CoreStats;
	protected readonly hp: Bounded;

	// Combat
	protected target?: BaseCharacter;
	protected attacks: Attack[] = [];
	private inCombat = false;
	private readonly onTick = (dt: number) => this.handleTick(dt);

	constructor(name: string, level: number, baseStats: CoreStats) {
		this.name = name;
		this.level = level;
		this.hp = new Bounded(0, baseStats.hp, baseStats.hp);
		this.base = baseStats;
		this.cooldown = new Bounded(0, this.MAX_COOLDOWN, this.MAX_COOLDOWN);

		const basicMelee = Attack.create("basic_melee");
		if (basicMelee) {
			this.attacks.push(basicMelee);
		}
	}

	get currentHp() {
		return this.hp.current;
	}
	get maxHp() {
		return this.hp.max;
	}

	public getName(): string {
		return this.name;
	}

	public getAttacks() {
		return this.attacks;
	}
	takeDamage(amount: number) {
		this.hp.decrease(amount);
	}
	heal(amount: number) {
		this.hp.increase(amount);
	}

	isAlive(): boolean {
		return this.currentHp > 0;
	}

	isAtMaxHp(): boolean {
		return this.currentHp === this.maxHp;
	}

	/* ---- simple getters for enemies ---- */
	get attack() {
		return this.base.attack;
	}
	get defence() {
		return this.base.defence;
	}
	get speed() {
		return this.base.speed;
	}

	// COMBAT

	public beginCombat(target: BaseCharacter) {
		bus.on("Game:GameTick", this.onTick);
		for (const attack of this.attacks) {
			attack.init();
		}
		this.target = target;
		this.inCombat = true;
	}

	public endCombat() {
		bus.off("Game:GameTick", this.onTick);
		this.inCombat = false;
	}

	public handleTick(dt: number): void {
		if (!this.inCombat) return;

		// Global Tick
		const adjustedCd = dt * 10 * this.speed;
		this.cooldown.adjust(adjustedCd * -1);

		// Tick down all attacks
		for (const attack of this.attacks) {
			attack.reduceCooldown(dt);
		}

		if (this.cooldown.current === 0 && this.target) {
			// Find next availbale attack, splice, perform and reinsert.
			const index = this.attacks.findIndex((atk) => atk.isReady());
			if (index !== 1) {
				const [nextAttack] = this.attacks.splice(index, 1);
				nextAttack.perform(this, this.target);
				this.attacks.push(nextAttack);
				this.cooldown.setToMax();
			}
		}
	}
	/* 	// TO USE IN FUTURE FOR ATTACK PRIORITIES
	private findNextAttackIndexByPriority(): number {
		for (const p of [AttackPriority.Immediate, AttackPriority.High, AttackPriority.Low]) {
			const idx = this.attacks.findIndex((a) => a.priority === p && a.isReady());
			if (idx !== -1) return idx;
		}
		return -1;
	} */

	// HELPER CLASSES
	snapshot(): CharacterSnapsnot {
		return {
			name: this.name,
			level: this.level,
			cooldown: this.cooldown,
			hp: this.hp,
			attack: this.attack,
			defence: this.defence,
			attacks: this.attacks,
			avatarUrl: "Todo",
			rarity: "Todo",
		};
	}
}
