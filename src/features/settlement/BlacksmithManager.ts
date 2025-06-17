import { bus } from "@/core/EventBus";
import { GameContext } from "@/core/GameContext";
import { Saveable } from "@/shared/storage-types";
import { BlacksmithUpgrade } from "./BlacksmithUpgrade";
import { BlacksmithUpgradeSpec, ResourceRequirement } from "@/shared/types";
import { Resource } from "@/features/inventory/Resource";

export interface CraftSlot {
    resourceId: string | null;
    progress: number;
}

interface BlacksmithSave {
    slots: CraftSlot[];
    unlockedSlots: number;
    upgrades: string[];
}

export class BlacksmithManager implements Saveable {
    private slots: CraftSlot[] = [{ resourceId: null, progress: 0 }];
    private unlockedSlots = 1;
    private upgrades = new Map<string, BlacksmithUpgrade>();
    private speedMultiplier = 1;

    constructor() {
        bus.on("Game:GameTick", (dt) => this.handleTick(dt));
    }

    private get resources() {
        return GameContext.getInstance().resources;
    }

    registerUpgrades(specs: BlacksmithUpgradeSpec[]) {
        BlacksmithUpgrade.registerSpecs(specs);
        specs.forEach((s) => this.upgrades.set(s.id, BlacksmithUpgrade.create(s.id)));
    }

    setSlotResource(index: number, id: string | null) {
        if (index >= this.slots.length) return;
        this.slots[index].resourceId = id;
    }

    getSlots(): CraftSlot[] {
        return this.slots;
    }

    getUpgrades(): BlacksmithUpgrade[] {
        return Array.from(this.upgrades.values());
    }

    purchaseUpgrade(id: string): boolean {
        const upg = this.upgrades.get(id);
        if (!upg || upg.isPurchased) return false;
        if (!this.resources.canAfford(upg.cost)) return false;
        upg.cost.forEach((c) => this.resources.consumeResource(c.resource, c.quantity));
        upg.purchase();
        if (id.startsWith("slot_")) {
            this.unlockedSlots += 1;
            this.slots.push({ resourceId: null, progress: 0 });
        }
        if (id === "better_tools") {
            this.speedMultiplier = 1.2;
        }
        bus.emit("blacksmith:changed");
        return true;
    }

    handleTick(dt: number) {
        for (const slot of this.slots) {
            if (!slot.resourceId) continue;
            const spec = Resource.getSpec(slot.resourceId);
            if (!spec) continue;
            if (slot.progress <= 0) {
                if (!this.resources.canAfford(spec.requires)) continue;
                spec.requires.forEach((r) => this.resources.consumeResource(r.resource, r.quantity));
                slot.progress = spec.craftTime;
            }
            if (slot.progress > 0) {
                slot.progress -= dt * this.speedMultiplier;
                if (slot.progress <= 0) {
                    this.resources.addResource(spec.id, 1);
                    this.resources.addResourceXP(spec.id, 1);
                    slot.progress = 0;
                }
            }
        }
    }

    // Save/Load
    save(): BlacksmithSave {
        return {
            slots: this.slots,
            unlockedSlots: this.unlockedSlots,
            upgrades: Array.from(this.upgrades.values())
                .filter((u) => u.isPurchased)
                .map((u) => u.id),
        };
    }

    load(data: BlacksmithSave): void {
        this.unlockedSlots = data.unlockedSlots || 1;
        this.slots = data.slots || [{ resourceId: null, progress: 0 }];
        (data.upgrades || []).forEach((id) => {
            const upg = this.upgrades.get(id);
            if (upg) upg.purchase();
            if (id.startsWith("slot_")) {
                // ensure slots array length
                if (this.slots.length < ++this.unlockedSlots) {
                    this.slots.push({ resourceId: null, progress: 0 });
                }
            }
            if (id === "better_tools") this.speedMultiplier = 1.2;
        });
    }
}
