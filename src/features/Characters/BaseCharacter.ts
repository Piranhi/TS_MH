import { Attack } from "@/models/attack";
import { Bounded } from "../../domain/value-objects/Bounded";
import { bus } from "@/EventBus";

export type StatKey = keyof CharacterStats;

export interface CharacterData {
	name: string;
	level: number;
	hp: Bounded;
	stats: CharacterStats;
}

export interface CharacterStats {
	strength: number;
	defence: number;
	attackBase: number;
	attackMulti: number;
}

export type StatsModifier = Partial<CharacterStats>;

export type CharacterSnapsnot = Readonly<CharacterData> & {
	avatarUrl: string;
	rarity: string;
};

export abstract class BaseCharacter {
	readonly name: string;
	readonly level: number;
	hp: Bounded;
	stats: CharacterStats;

	protected target!: BaseCharacter;
	protected attacks: Attack[] = [];
	private inCombat = false;
	private readonly onTick = (dt: number) => this.handleTick(dt);

	constructor({ name, level = 1, hp, stats: { strength, defence } }: CharacterData) {
		this.name = name;
		this.level = level;
		this.hp = hp;
		this.stats = { strength, defence, attackBase: 1, attackMulti: 1 };

		const basicMelee = Attack.create("basic_melee")
		if (basicMelee) {
			this.attacks.push(basicMelee);
		}
	}

	public getHP(): Bounded {
		return this.hp;
	}

	public getName(): string {
		return this.name;
	}

	public takeDamage(amount: number): void {
		this.hp.decrease(amount);
	}

	public heal(amount: number): void {
		this.hp.increase(amount);
	}

	public isAlive(): boolean {
		return this.hp.current > 0;
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

	public attack(target: BaseCharacter): void {
		const damage = this.stats.strength - target.stats.defence;
		target.takeDamage(Math.max(1, damage)); // Ensure minimum 1 dmg
	}

	public handleTick(dt: number): void {
		if (!this.inCombat) return;

		for (const attack of this.attacks) {
			attack.reduceCooldown(dt);
			if (attack.isReady()) {
				attack.perform(this, this.target);
			}
		}
	}

	// HELPER CLASSES
	snapshot(): CharacterSnapsnot {
		return {
			name: this.name,
			level: this.level,
			hp: this.hp,
			stats: this.stats,
			avatarUrl: "Todo",
			rarity: "Todo",
		};
	}
}
