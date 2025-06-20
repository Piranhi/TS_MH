import { bus } from "@/core/EventBus";
import { GameContext } from "@/core/GameContext";
import { Saveable } from "@/shared/storage-types";
import { StatsModifier } from "@/models/Stats";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { ClassSpec, ClassSystemState, NodeEffect } from "./ClassTypes";

export class ClassManager implements Saveable<ClassSystemState> {
	private specs = new Map<string, ClassSpec>();
	private unlocked = new Set<string>();
	private nodePoints = new Map<string, Map<string, number>>();
	private availablePoints = 0;

	constructor(specs: ClassSpec[] = []) {
		specs.forEach((s) => {
			this.specs.set(s.id, s);
			this.nodePoints.set(s.id, new Map());
		});
		bus.on("player:level-up", () => this.gainPoints(GAME_BALANCE.classes.pointsPerLevel));
		bus.on("game:prestigePrep", () => this.resetPoints());
		bus.on("game:gameLoaded", () => this.recalculate());
	}

	unlockClass(id: string) {
		if (this.specs.has(id)) this.unlocked.add(id);
	}

	gainPoints(amount: number) {
		this.availablePoints += amount;
		bus.emit("classes:pointsChanged", this.availablePoints);
	}

	getAvailablePoints() {
		return this.availablePoints;
	}

	/** Get all registered class specs */
	getClassSpecs(): ClassSpec[] {
		return Array.from(this.specs.values());
	}

	/** Points allocated to a specific node */
	getNodePoints(classId: string, nodeId: string): number {
		return this.nodePoints.get(classId)?.get(nodeId) ?? 0;
	}

	/** Total points spent across all classes */
	getSpentPoints(): number {
		let spent = 0;
		for (const spec of this.specs.values()) {
			const map = this.nodePoints.get(spec.id)!;
			spec.nodes.forEach((n) => {
				const pts = map.get(n.id) || 0;
				spent += pts * n.cost;
			});
		}
		return spent;
	}

	allocatePoint(classId: string, nodeId: string): boolean {
		const classSpec = this.specs.get(classId);
		if (!classSpec) return false;
		const node = classSpec.nodes.find((n) => n.id === nodeId);
		if (!node) return false;
		if (this.availablePoints < node.cost) return false;
		const map = this.nodePoints.get(classId)!;
		const current = map.get(nodeId) || 0;
		if (current >= node.maxPoints) return false;
		if (node.prereq) {
			const pre = map.get(node.prereq) || 0;
			if (pre === 0) return false;
		}
		this.availablePoints -= node.cost;
		map.set(nodeId, current + 1);
		this.recalculate();
		bus.emit("classes:pointsChanged", this.availablePoints);
		bus.emit("classes:nodesChanged", null);
		return true;
	}

	private recalculate() {
		const statMods: StatsModifier = {};
		let abilities: string[] = [];
		for (const [classId, nodes] of this.nodePoints) {
			for (const [nodeId, pts] of nodes) {
				const spec = this.specs.get(classId)?.nodes.find((n) => n.id === nodeId);
				if (!spec) continue;
				spec.effects.forEach((eff: NodeEffect) => {
					if (eff.kind === "statModifier") {
						statMods[eff.stat] = (statMods[eff.stat] || 0) + eff.amount * pts;
					} else if (eff.kind === "unlockAbility" && pts > 0) {
						abilities.push(eff.abilityId);
					}
				});
			}
		}
		abilities = Array.from(new Set(abilities));
		const context = GameContext.getInstance();
		if (context.currentRun) {
			context.character.setClassAbilities(abilities);
			context.character.statsEngine.setLayer("classes", () => statMods);
		}
	}

	public refresh() {
		this.recalculate();
	}

	resetPoints() {
		for (const map of this.nodePoints.values()) map.clear();
		this.availablePoints = 0;
		this.recalculate();
	}

	save(): ClassSystemState {
		const nodePointsObj: Record<string, Record<string, number>> = {};
		for (const [c, map] of this.nodePoints) {
			nodePointsObj[c] = Object.fromEntries(map);
		}
		return {
			unlockedClasses: Array.from(this.unlocked),
			nodePoints: nodePointsObj,
			availablePoints: this.availablePoints,
		};
	}

	load(state: ClassSystemState): void {
		this.unlocked = new Set(state.unlockedClasses || []);
		this.availablePoints = state.availablePoints || 0;
		for (const [cid, nodes] of Object.entries(state.nodePoints || {})) {
			let map = this.nodePoints.get(cid);
			if (!map) {
				map = new Map();
				this.nodePoints.set(cid, map);
			} else {
				map.clear();
			}
			for (const [nid, val] of Object.entries(nodes)) {
				map.set(nid, val);
			}
		}
		this.recalculate();
	}
}
