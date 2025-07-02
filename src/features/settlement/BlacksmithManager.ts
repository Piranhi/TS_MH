import { bus } from "@/core/EventBus";
import { GameContext } from "@/core/GameContext";
import { Saveable } from "@/shared/storage-types";
import { BlacksmithUpgrade } from "./BlacksmithUpgrade";
import { BlacksmithUpgradeSpec } from "@/shared/types";
import { Resource } from "@/features/inventory/Resource";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { GameBase } from "@/core/GameBase";
import { OfflineProgressHandler } from "@/models/OfflineProgress";

export interface CraftSlot {
	resourceId: string | null;
	progress: number;
}

interface BlacksmithSave {
	slots: CraftSlot[];
	unlockedSlots: number;
	upgrades: string[];
}

export class BlacksmithManager extends GameBase implements Saveable, OfflineProgressHandler {
	private slots: CraftSlot[] = [{ resourceId: null, progress: 0 }];
	private unlockedSlots = 1;
	private upgrades = new Map<string, BlacksmithUpgrade>();
        private speedMultiplier = 1;
	private rawOreTimer = 0;

        constructor() {
                super();
                bus.on("Game:GameTick", (dt) => this.handleTick(dt));
                bus.on("game:prestigePrep", () => this.prestigeReset());
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
		if (this.slots[index].resourceId === id) return; // Don't reset or change if selecting the same id.

		this.slots[index].resourceId = id;
		this.slots[index].progress = 0;
	}

	getSlots(): CraftSlot[] {
		return this.slots;
	}

        getUpgrades(): BlacksmithUpgrade[] {
                return Array.from(this.upgrades.values());
        }

        /** Get the current global speed multiplier from blacksmith upgrades */
        getSpeedMultiplier(): number {
                return this.speedMultiplier;
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

	/**
	 * Advances the crafting progress for each blacksmith slot by the given delta time.
	 *
	 * Iterates through all slots and performs the following for each:
	 * - Skips slots without a resource assigned.
	 * - Retrieves the resource specification; skips if not found.
	 * - If the slot's progress is zero or less:
	 *   - Checks if the required resources are available; skips if not.
	 *   - Consumes the required resources and resets the slot's progress to the craft time.
	 * - If the slot's progress is greater than zero:
	 *   - Decreases the progress based on the elapsed time and speed multiplier.
	 *   - If progress reaches zero or less, awards the crafted resource and XP, and resets progress.
	 *
	 * @param dt - The delta time (in seconds) to advance crafting progress.
	 *
	 * @remarks
	 * - `if (!slot.resourceId) continue;`
	 *   Skips processing for slots that do not have a resource assigned.
	 *
	 * - `if (!spec) continue;`
	 *   Skips processing if the resource specification cannot be found.
	 *
	 * - `if (slot.progress <= 0) { ... }`
	 *   If the slot is not currently crafting, checks if resources can be afforded and starts crafting if possible.
	 *
	 * - `if (slot.progress > 0) { ... }`
	 *   If the slot is crafting, advances progress and completes crafting if finished.
	 *
	 * - `if (slot.progress <= 0) { ... }` (inside progress decrement)
	 *   If crafting is complete, awards the resource and XP, and resets progress.
	 */
	handleTick(dt: number) {
		this.addRawOre(dt);
		this.processSlots(dt);
	}

	handleOfflineProgress(offlineSeconds: number): null {
		this.addRawOre(offlineSeconds);
		let remainingTime = offlineSeconds;

		while (remainingTime > 0) {
			const chunk = Math.min(remainingTime, GAME_BALANCE.offline.blacksmithChunkTime);
			this.processSlots(chunk);
			remainingTime -= chunk;
		}
		return null;
	}

	addRawOre(dt: number) {
		this.rawOreTimer += dt;
		const craftTime = GAME_BALANCE.blacksmith.defaultRawOreCraftTime;

		if (this.rawOreTimer >= craftTime) {
			// Calculate all cycles at once for efficiency.
			const cyclesCompleted = Math.floor(this.rawOreTimer / craftTime);
			const earnedOre = cyclesCompleted * 10; //* (GameContext.getInstance().settlement.getBuilding("blacksmith")?.level ?? 1);
			this.resources.addResource("raw_ore", earnedOre);
			this.rawOreTimer = this.rawOreTimer % craftTime;
		}
	}

	// Process each slot - Allows offline chunking too.
	private processSlots(dt: number) {
		for (const slot of this.slots) {
			if (!slot.resourceId) continue;
                        const spec = Resource.getSpec(slot.resourceId);
                        if (!spec) continue;

                        const craftData = this.resources.getCraftingData(slot.resourceId);

                        if (slot.progress <= 0) {
                                if (!this.resources.canAfford(craftData.costs)) continue;

                                craftData.costs.forEach((r) => this.resources.consumeResource(r.resource, r.quantity));
                                slot.progress = craftData.time;
                        }

                        if (slot.progress > 0) {
                                slot.progress -= dt;

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

        /** Reset crafting slots when a prestige occurs */
        prestigeReset() {
                this.slots = Array.from({ length: this.unlockedSlots }, () => ({
                        resourceId: null,
                        progress: 0,
                }));
                this.rawOreTimer = 0;
                bus.emit("blacksmith:slots-changed");
        }

	// -- UI Helper Methods --
	/**
	 * Returns the current progress of the implicit Raw Ore crafting loop so that UI
	 * elements can render a progress bar and the amount of ore that will be granted
	 * once a cycle completes.
	 */
	public getRawOreStatus() {
		const craftTime = GAME_BALANCE.blacksmith.defaultRawOreCraftTime;
		const buildingLevel = GameContext.getInstance().settlement.getBuilding("blacksmith")?.level ?? 1;
		return {
			progress: this.rawOreTimer, // seconds elapsed in current cycle
			craftTime, // total seconds required for a cycle
			orePerCycle: 10 * buildingLevel, // amount awarded at the end of a cycle
			ratio: this.rawOreTimer / craftTime,
		};
	}
}
