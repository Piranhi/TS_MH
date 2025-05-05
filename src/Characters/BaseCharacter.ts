import { Bounded } from "../domain/value-objects/Bounded";
import { CharacterData } from "../types/character";
import { CharacterSnapsnot } from "@/Screens/Widgets/CharacterHolder";

type CombatAttack = {
    name: string;
    cooldown: number;
    lastUsed: number;
    perform: (target: BaseCharacter) => void;
};

export abstract class BaseCharacter {
    protected target: BaseCharacter;
    protected attacks: CombatAttack[] = [];

    constructor(protected data: CharacterData) {
        this.data = data;
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
        this.target = target;
    }

    public attack(target: BaseCharacter): void {
        const damage = this.data.CharacterStats.strength - target.data.CharacterStats.defence;
        target.takeDamage(Math.max(1, damage)); // Ensure minimum 1 dmg
    }

    public tick(currentTime: number): void {
        for (const attack of this.attacks) {
            if (currentTime - attack.lastUsed >= attack.cooldown) {
                // Find a target and perform attack
                // attack.perform(someTarget);
                attack.lastUsed = currentTime;
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
