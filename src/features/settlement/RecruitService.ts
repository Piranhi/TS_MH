import { Saveable } from "@/shared/storage-types";
import { bus } from "@/core/EventBus";
import { ItemRarity, BuildingType } from "@/shared/types";
import { Recruit, RecruitProfession, RecruitState } from "@/models/Recruit";
import { Trait } from "@/models/Trait";

interface RecruitServiceSaveState {
    recruits: RecruitState[];
    settlementRenown: number;
    nextId: number;
}

export class RecruitService implements Saveable<RecruitServiceSaveState> {
    private recruits = new Map<string, Recruit>();
    private settlementRenown = 0;
    private nextId = 1;

    addSettlementRenown(amount: number) {
        if (amount <= 0) return;
        this.settlementRenown += amount;
        bus.emit("settlement:renownChanged", this.settlementRenown);
    }

    getSettlementRenown() {
        return this.settlementRenown;
    }

    /** Number of permanent prestige tiers */
    getPrestigeTier(): number {
        return Math.floor(this.settlementRenown / 10000);
    }

    /** Generate and store a new recruit */
    createRecruit(profession: RecruitProfession): Recruit {
        const rarity = this.rollRarity();
        const positive = Trait.getRandomTrait().id;
        const negative = Trait.getRandomTrait().id;
        const recruit = new Recruit({
            id: String(this.nextId++),
            profession,
            rarity,
            positiveTrait: positive,
            negativeTrait: negative,
            bondXp: 0,
        });
        this.recruits.set(recruit.id, recruit);
        bus.emit("recruits:changed", undefined);
        return recruit;
    }

    getRecruits(): Recruit[] {
        return Array.from(this.recruits.values());
    }

    getRecruit(id: string): Recruit | undefined {
        return this.recruits.get(id);
    }

    assignRecruit(id: string, building: BuildingType): boolean {
        const r = this.recruits.get(id);
        if (!r) return false;
        r.assign(building);
        bus.emit("recruits:changed", undefined);
        return true;
    }

    unassignRecruit(id: string): void {
        const r = this.recruits.get(id);
        if (!r) return;
        r.assign(undefined);
        bus.emit("recruits:changed", undefined);
    }

    private rollRarity(): ItemRarity {
        const tier = this.getPrestigeTier();
        let roll = Math.random();
        roll += tier * 0.05; // small bump per tier
        if (roll > 0.95) return "legendary";
        if (roll > 0.85) return "epic";
        if (roll > 0.6) return "rare";
        if (roll > 0.3) return "uncommon";
        return "common";
    }

    save(): RecruitServiceSaveState {
        return {
            recruits: this.getRecruits().map((r) => r.toJSON()),
            settlementRenown: this.settlementRenown,
            nextId: this.nextId,
        };
    }

    load(state: RecruitServiceSaveState): void {
        this.recruits.clear();
        state.recruits?.forEach((r) => {
            this.recruits.set(r.id, Recruit.fromJSON(r));
        });
        this.settlementRenown = state.settlementRenown || 0;
        this.nextId = state.nextId || 1;
        bus.emit("settlement:renownChanged", this.settlementRenown);
        bus.emit("recruits:changed", undefined);
    }
}
