import { bus } from "@/core/EventBus";
import { Building } from "@/models/Building";
import { BigNumber } from "@/models/utils/BigNumber";
import { BuildingType } from "@/shared/types";

export class SettlementManager {
	private freePlots = 1;
	private buildingsMap = new Map<BuildingType, Building>();

	constructor() {
		this.buildingsMap.set("library", { type: "library", level: 5, progress: new BigNumber(500) });
		this.buildingsMap.set("blacksmith", { type: "blacksmith", level: 2, progress: new BigNumber(500) });
	}

	getFreePlots(): number {
		return this.freePlots;
	}

	geTotalPlots(): number {
		return this.freePlots + this.buildingsMap.size;
	}

	hasFreePlotsTd(): boolean {
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
		bus.emit("settlement:changed");
	}

	buildBuilding(id: string) {
		if (this.freePlots <= 0) return false;
		const building = Building.create(id);
		this.buildingsMap.set(building.id, building);
		this.freePlots--;

		bus.emit("settlement:changed");
	}

	upgradeBuilding(type: BuildingType) {
		const building = this.buildingsMap.get(type);
		if (!building) return false;
		building.upgradeBuilding();
		bus.emit("settlement:changed");
	}
}
