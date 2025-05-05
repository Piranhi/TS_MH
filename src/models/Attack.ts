import { BaseCharacter } from "@/Characters/BaseCharacter";

export interface AttackSpec {
    id: string;
    displayName: string;
    type: "physical" | "magical";
    power: number;
    cooldown: number;
}

type attackState = {
    spec: AttackSpec;
    currentCooldown: number;
};

export class Attack {
    public currentCooldown: number = 0;
    constructor(private readonly spec: AttackSpec) {
        this.currentCooldown = spec.cooldown;
    }

    perform(self: BaseCharacter, target: BaseCharacter) {
        console.log("Attacking");
        target.takeDamage(this.spec.power);
        this.currentCooldown = this.spec.cooldown;
    }

    get id() {
        return this.spec.id;
    }
    get name() {
        return this.spec.displayName;
    }

    init() {
        this.currentCooldown = this.spec.cooldown;
    }

    reduceCooldown(dt: number) {
        this.currentCooldown -= dt;
    }

    isReady() {
        return this.currentCooldown <= 0;
    }
}
