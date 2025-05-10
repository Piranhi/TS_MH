import { Attack } from "./Attack";
import { Bounded } from "./value-objects/Bounded";
import { bus } from "@/core/EventBus";
import type { CoreStats, StatsModifier } from "@/models/Stats";

export interface CharacterData<S extends CoreStats = CoreStats> {
    name: string;
    level: number;
    hp: Bounded;
    stats: S;
}
export type CharacterSnapsnot = Readonly<CharacterData> & {
    avatarUrl: string;
    rarity: string;
};

/**
 * Generic so subclasses decide what their stat‑shape is.
 */
export abstract class BaseCharacter<S extends CoreStats = CoreStats> {
    readonly name: string;
    readonly level: number;

    /** Raw (unmodified) stats */
    protected readonly baseStats: S;
    /** Temporary / permanent bonuses */
    protected readonly modifiers: StatsModifier<S>[] = [];

    /** Bounded wrapper keeps us safe from negatives / overheal */
    protected readonly hp: Bounded;

    // Combat
    protected target?: BaseCharacter<any>;
    protected attacks: Attack[] = [];
    private inCombat = false;
    private readonly onTick = (dt: number) => this.handleTick(dt);

    constructor({ name, level, hp, stats }: CharacterData<S>) {
        this.name = name;
        this.level = level;
        this.hp = hp;
        this.baseStats = stats;

        const basicMelee = Attack.create("basic_melee");
        if (basicMelee) {
            this.attacks.push(basicMelee);
        }
    }

    getStat<K extends keyof S>(key: K): number {
        const base = this.baseStats[key] as unknown as number;
        const bonus = this.modifiers.reduce((sum, m) => sum + (m[key] ?? 0), 0);
        return base + bonus;
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
    takeDamage(amount: number) {
        this.hp.decrease(amount);
    }
    heal(amount: number) {
        this.hp.increase(amount);
    }
    isAlive(): boolean {
        return this.currentHp > 0;
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
        const damage = this.baseStats.attack - target.baseStats.defence;
        target.takeDamage(Math.max(1, damage)); // Ensure minimum 1 dmg
    }

    public handleTick(dt: number): void {
        if (!this.inCombat) return;

        for (const attack of this.attacks) {
            attack.reduceCooldown(dt);
            if (attack.isReady() && this.target) {
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
            stats: this.baseStats,
            avatarUrl: "Todo",
            rarity: "Todo",
        };
    }
}
