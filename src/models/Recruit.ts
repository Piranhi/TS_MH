import { ItemRarity, BuildingType } from "@/shared/types";
import { Trait } from "./Trait";

export type RecruitProfession =
    | "blacksmith"
    | "apothecary"
    | "scout"
    | "miner"
    | "librarian";

export interface RecruitState {
    id: string;
    profession: RecruitProfession;
    rarity: ItemRarity;
    positiveTrait: string;
    negativeTrait: string;
    bondXp: number;
    assignedBuilding?: BuildingType;
}

export class Recruit {
    constructor(private state: RecruitState) {}

    get id() {
        return this.state.id;
    }
    get profession() {
        return this.state.profession;
    }
    get rarity() {
        return this.state.rarity;
    }
    get positiveTrait() {
        return Trait.create(this.state.positiveTrait);
    }
    get negativeTrait() {
        return Trait.create(this.state.negativeTrait);
    }
    get bondXp() {
        return this.state.bondXp;
    }

    get assignedBuilding(): BuildingType | undefined {
        return this.state.assignedBuilding;
    }

    assign(building: BuildingType | undefined) {
        this.state.assignedBuilding = building;
    }

    addBondXp(amount: number) {
        this.state.bondXp += amount;
    }

    /** Simple 1% bonus per 100 bond XP */
    get bondBonus(): number {
        return Math.floor(this.state.bondXp / 100) / 100;
    }

    toJSON(): RecruitState {
        return { ...this.state };
    }

    static fromJSON(state: RecruitState): Recruit {
        return new Recruit({ ...state });
    }
}
