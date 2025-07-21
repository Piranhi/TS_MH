import { bus } from "@/core/EventBus";
import { GameContext } from "@/core/GameContext";
import { Saveable } from "@/shared/storage-types";
import { BlacksmithUpgrade } from "./BlacksmithUpgrade";
import { BlacksmithUpgradeSpec } from "@/shared/types";
import { Resource } from "@/features/inventory/Resource";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { OfflineProgressHandler } from "@/models/OfflineProgress";
import { Destroyable } from "@/core/Destroyable";
import { bindEvent } from "@/shared/utils/busUtils";

export interface CraftSlot {
	resourceId: string | null;
	progress: number;
}

interface BlacksmithSave {
	slots: CraftSlot[];
	unlockedSlots: number;
	upgrades: Record<string, number>;
}

export class BlacksmithManager extends Destroyable implements Saveable, OfflineProgressHandler {
	private slots: CraftSlot[] = [{ resourceId: null, progress: 0 }];
	private unlockedSlots = 4;
	private upgrades = new Map<string, BlacksmithUpgrade>();
	private speedMultiplier = 1;
	private rawOreTimer = 0;

	constructor() {
		super();
		this.initaliseResearch();
		this.setupTickingFeature("feature.blacksmith", () => {
			this.setupEventBindings();
			this.createDefaultSlots();
		});
	}

	protected handleTick(dt: number) {
		if (!this.isFeatureActive()) return;
		this.addRawOre(dt);
		this.processSlots(dt);
	}

	private createDefaultSlots(): void {
		this.slots = [];
		for (let i = 0; i < this.unlockedSlots; i++) {
			this.slots.push({ resourceId: null, progress: 0 });
		}
	}

	private setupEventBindings() {
		//bindEvent(this.eventBindings, "Game:GameTick", (dt) => this.handleTick(dt));
		bindEvent(this.eventBindings, "game:prestigePrep", () => this.prestigeReset());
	}

	private get resources() {
		return GameContext.getInstance().resources;
	}

	registerUpgrades(specs: BlacksmithUpgradeSpec[]) {
		BlacksmithUpgrade.registerSpecs(specs);
		specs.forEach((s) => this.upgrades.set(s.id, BlacksmithUpgrade.create(s.id)));
	}

	private initaliseResearch() {
		const specs = BlacksmithUpgrade.getAllSpecs();
		specs.forEach((s) => {
			this.upgrades.set(s.id, BlacksmithUpgrade.create(s.id));
		});
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

	/** Get the current global speed multiplier from blacksmith upgrades and building efficiency */
	getSpeedMultiplier(): number {
		const buildingMult = GameContext.getInstance().settlement.getBuilding("blacksmith")?.getEfficiencyMultiplier?.() ?? 1;
		return this.speedMultiplier * buildingMult;
	}

	purchaseUpgrade(id: string): boolean {
		const upg = this.upgrades.get(id);

		if (!upg || upg.isPurchased) return false;
		if (!this.resources.canAfford(upg.cost)) return false;
		upg.cost.forEach((c) => this.resources.consumeResource(c.resource, c.quantity));
		upg.purchase();
		this.applyUpgradeEffects(upg);
		bus.emit("blacksmith:changed");
		return true;
	}

	// Apply the effects of an upgrade to the blacksmith manager.
	private applyUpgradeEffects(upg: BlacksmithUpgrade): void {
		const { id, currentLevel } = upg;
		const context = GameContext.getInstance();

		// Adds unique equipment quality modifier for each upgrade.
		if (id.includes("equipmentUpgrade")) {
			const bonus = 0.1 * currentLevel;
			context.modifiers.addModifier("equipmentQuality", "permanent", id, 1 + bonus);
			bus.emit("inventory:changed");
		} else if (id.startsWith("slot_")) {
			this.unlockedSlots += 1;
			this.slots.push({ resourceId: null, progress: 0 });
		} else if (id === "better_tools") {
			this.speedMultiplier = 1 + 0.2 * currentLevel;
		}
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
		const upgrades: Record<string, number> = {};
		this.upgrades.forEach((u, id) => {
			if (u.currentLevel > 0) upgrades[id] = u.currentLevel;
		});
		return {
			slots: this.slots,
			unlockedSlots: this.unlockedSlots,
			upgrades,
		};
	}

	load(data: BlacksmithSave): void {
		this.unlockedSlots = data.unlockedSlots || 1;
		this.slots = data.slots || [{ resourceId: null, progress: 0 }];
		Object.entries(data.upgrades || {}).forEach(([id, level]) => {
			const upg = this.upgrades.get(id);
			if (!upg) return;
			upg.setLevel(level);
			if (id === "better_tools") {
				this.speedMultiplier = 1 + 0.2 * upg.currentLevel;
			}
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

	public debugLevelUpResource() {
		for (const slot of this.slots) {
			if (!slot.resourceId) continue;
			this.resources.addResourceXP(slot.resourceId, -1);
		}
	}

	public debugAddResources() {
		const specs = Resource.getAllSpecs();
		specs.forEach((s) => {
			this.resources.addResource(s.id, 1000000);
		});
	}
}
