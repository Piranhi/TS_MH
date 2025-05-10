import { Attack } from "./Attack";
import { Bounded } from "./value-objects/Bounded";
import { bus } from "@/core/EventBus";
import type { CoreStats } from "@/models/Stats";

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

export type characterTeam = "player" | "enemy";


export abstract class BaseCharacter{
    readonly name: string;
    readonly level: number;
    protected readonly base: CoreStats;
    protected readonly hp: Bounded;
	public team: characterTeam;

    // Combat
    protected target?: BaseCharacter;
    protected attacks: Attack[] = [];
    private inCombat = false;
    private readonly onTick = (dt: number) => this.handleTick(dt);

    constructor(name: string, level: number, baseStats:CoreStats){
        this.name = name;
        this.level = level;
        this.hp = new Bounded(0, baseStats.maxHp, baseStats.maxHp)
        this.base = baseStats;

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
    takeDamage(amount: number) {
        this.hp.decrease(amount);
    }
    heal(amount: number) {
        this.hp.increase(amount);
    }
    isAlive(): boolean {
        return this.currentHp > 0;
    }

	  /* ---- simple getters for enemies ---- */
  get attack()  { return this.base.attack;  }
  get defence() { return this.base.defence; }
  get speed()   { return this.base.speed;   }

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

/*     public attack(target: BaseCharacter): void {
        const damage = this.baseStats.attack - target.baseStats.defence;
        target.takeDamage(Math.max(1, damage)); // Ensure minimum 1 dmg
    } */

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
            stats: this.base,
            avatarUrl: "Todo",
            rarity: "Todo",
        };
    }
}
