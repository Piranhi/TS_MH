import { Attack } from "@/models/attack";
import { Bounded } from "../domain/value-objects/Bounded";
import { CharacterData } from "../types/character";
import { CharacterSnapsnot } from "@/Screens/Widgets/CharacterHolder";
import { attackSpecById } from "@/gameData";
import { bus } from "@/EventBus";

export abstract class BaseCharacter {
    protected target: BaseCharacter;
    protected attacks: Attack[] = [];
    private inCombat: boolean = false;
    private readonly onTick = (dt: number) => this.handleTick(dt);

    constructor(protected data: CharacterData) {
        const basicMelee = attackSpecById.get("basic_melee");
        if (basicMelee) {
            this.attacks.push(new Attack(basicMelee));
        }
    }

    static createNew<T extends BaseCharacter>(this: new (data: CharacterData) => T, data: CharacterData): T {
        return new this(data);
    }

    public getHP(): Bounded {
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
        bus.on("Game:UITick", this.onTick);
        for (const attack of this.attacks) {
            attack.init();
        }
        this.target = target;
        this.inCombat = true;
    }

    public endCombat() {
        bus.off("Game:UITick", this.onTick);
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
