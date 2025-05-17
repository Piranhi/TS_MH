import { bus } from "@/core/EventBus";
import { saveManager } from "@/core/SaveManager";
import { Building } from "@/models/Building";
import { Saveable } from "@/shared/storage-types";
import { BuildingType } from "@/shared/types";

interface SettlementSaveState {
	freePlots: number;
	buildings: [BuildingType, Building][];
}

export class SettlementManager implements Saveable {
	private freePlots = 1;
	private buildingsMap = new Map<BuildingType, Building>();

	constructor() {
		saveManager.register("Settlement", this);
		this.buildingsMap.set("library", Building.create("library"));
		this.buildingsMap.set("blacksmith", Building.create("blacksmith"));
		this.emitChange();
	}

	getFreePlots(): number {
		return this.freePlots;
	}

	getTotalPlots(): number {
		return this.freePlots + this.buildingsMap.size;
	}

	hasFreePlots(): boolean {
		return this.freePlots > 0;
	}

	getBuilding(type: BuildingType): Building | undefined {
		return this.buildingsMap.get(type);
	}

	getAllBuildings() {
		return Array.from(this.buildingsMap.values());
	}

	addPlot() {
		this.freePlots++;
		this.emitChange();
	}

	buildBuilding(type: BuildingType) {
		if (this.freePlots <= 0) return false;
		const building = Building.create(type.toString());
		this.buildingsMap.set(type, building);
		this.freePlots--;
		this.emitChange();
		bus.emit("settlement:changed");
	}

	upgradeBuilding(type: BuildingType) {
		const building = this.buildingsMap.get(type);
		if (!building) return false;
		building.upgradeBuilding();
		this.emitChange();
	}

	emitChange() {
		bus.emit("settlement:changed");
	}

	save(): SettlementSaveState {
		return {
			buildings: Array.from(this.buildingsMap),
			freePlots: this.freePlots,
		};
	}

	load(state: SettlementSaveState): void {
		this.buildingsMap = new Map(state.buildings || []);
		this.freePlots = state.freePlots;
		this.emitChange();
	}
}
