import { Attack } from "@/models/attack";
import { Bounded } from "../domain/value-objects/Bounded";
import { CharacterData } from "../types/character";
import { CharacterSnapsnot } from "@/Screens/Widgets/CharacterHolder";
import { attackById, attackSpecById } from "@/gameData";
import { bus } from "@/EventBus";

export abstract class BaseCharacter {
    protected target: BaseCharacter;
    protected attacks: Attack[] = [];
    private inCombat: boolean = false;

    constructor(protected data: CharacterData) {
        const basicMelee = attackSpecById.get("basic_melee");
        if (basicMelee) {
            this.attacks.push(new Attack(basicMelee));
        }
        this.data = data;
        bus.on("Game:UITick", (dt) => this.handleTick(dt));
    }

    static createNew<T extends BaseCharacter>(this: new (data: CharacterData) => T, data: CharacterData): T {
        return new this(data);
    }

    public getHealth(): Bounded {
        return this.data.hp;
    }

    public getName(): string {
        return this.data.name;
    }

    public takeDamage(amount: number): void {
        this.data.hp.decrease(amount);
    }

    public heal(amount: number): void {
        this.data.hp.increase(amount);
    }

    public isAlive(): boolean {
        return this.data.hp.current > 0;
    }

    // COMBAT

    public beginCombat(target: BaseCharacter) {
        for (const attack of this.attacks) {
            attack.init();
        }
        this.target = target;
        this.inCombat = true;
    }

    public endCombat() {
        this.inCombat = false;
    }

    public attack(target: BaseCharacter): void {
        const damage = this.data.CharacterStats.strength - target.data.CharacterStats.defence;
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
            name: this.data.name,
            hp: this.data.hp,
        };
    }
}
