import { bus } from "@/core/EventBus";
import { GameContext } from "@/core/GameContext";
import { Saveable } from "@/shared/storage-types";
import { AbilityModifierStats, StatsModifier } from "@/models/Stats";
import { GAME_BALANCE } from "@/balance/GameBalance";
import { ClassSpec, ClassSystemState, NodeEffect } from "./ClassTypes";
import { bindEvent } from "@/shared/utils/busUtils";
import { Destroyable } from "@/core/Destroyable";

export class ClassManager extends Destroyable implements Saveable<ClassSystemState> {
	private specs = new Map<string, ClassSpec>();
	private unlocked = new Set<string>();
	private nodePoints = new Map<string, Map<string, number>>();

	constructor(specs: ClassSpec[] = []) {
		super();
		specs.forEach((s) => {
			this.specs.set(s.id, s);
			this.nodePoints.set(s.id, new Map());
		});
		this.setupFeatureUnlock("feature.classes", () => {
			this.bindEvents();
		});
	}

	private bindEvents() {
		bindEvent(this.eventBindings, "player:level-up", () => this.gainPoints(GAME_BALANCE.classes.pointsPerLevel));
		bindEvent(this.eventBindings, "game:gameReady", () => this.recalculate());
		// Note: Removed prestige reset since class points are now permanent bloodline stats
	}

	unlockClass(id: string) {
		if (this.specs.has(id)) this.unlocked.add(id);
	}

	gainPoints(amount: number) {
		const context = GameContext.getInstance();
		if (context.player) {
			context.player.modifyBloodlineStat("classPoints", amount);
			bus.emit("classes:pointsChanged");
		}
	}

	getAvailablePoints(): number {
		const context = GameContext.getInstance();
		return context.player?.getBloodlineStat("classPoints") ?? 0;
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
		const context = GameContext.getInstance();
		if (!context.player) return false;

		const classSpec = this.specs.get(classId);
		if (!classSpec) return false;
		const node = classSpec.nodes.find((n) => n.id === nodeId);
		if (!node) return false;

		const availablePoints = context.player.getBloodlineStat("classPoints");
		if (availablePoints < node.cost) return false;

		const map = this.nodePoints.get(classId)!;
		const current = map.get(nodeId) || 0;
		if (current >= node.maxPoints) return false;
		if (node.prereq) {
			const pre = map.get(node.prereq) || 0;
			if (pre === 0) return false;
		}

		// Spend the points from bloodline stats
		context.player.modifyBloodlineStat("classPoints", -node.cost);
		map.set(nodeId, current + 1);
		this.recalculate();
		bus.emit("classes:pointsChanged");
		bus.emit("classes:nodesChanged");
		return true;
	}

	private recalculate() {
		const statMods: StatsModifier = {};
		let abilities: string[] = [];
		const context = GameContext.getInstance();
		if (!context.currentRun) return; // Fail safe - no run

		for (const [classId, nodes] of this.nodePoints) {
			for (const [nodeId, pts] of nodes) {
				const spec = this.specs.get(classId)?.nodes.find((n) => n.id === nodeId);
				if (!spec) continue;

				spec.effects.forEach((nodeEffect: NodeEffect) => {
					if (nodeEffect.kind === "statModifier") {
						if (nodeEffect.stat && nodeEffect.amount !== undefined) {
							statMods[nodeEffect.stat as keyof StatsModifier] =
								(statMods[nodeEffect.stat as keyof StatsModifier] || 0) + nodeEffect.amount * pts;
						}
					} else if (nodeEffect.kind === "unlockAbility" && pts > 0) {
						if (nodeEffect.abilityId) {
							abilities.push(nodeEffect.abilityId);
						}
					} else if (nodeEffect.kind === "abilityModifier") {
						if (nodeEffect.abilityId && nodeEffect.stat !== undefined && nodeEffect.amount !== undefined) {
							context.character.addAbilityModifier(nodeEffect.abilityId, {
								stat: nodeEffect.stat as AbilityModifierStats,
								amount: nodeEffect.amount,
								source: classId,
							});
						}
					}
				});
			}
		}
		abilities = Array.from(new Set(abilities));
		if (context.currentRun) {
			for (const ability of abilities) {
				context.character.addNewAbility(ability);
			}
			context.character.statsEngine.setLayer("classes", () => statMods);
		}
	}

	public refresh() {
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
			// availablePoints now managed by Player's BloodlineStats
		};
	}

	load(state: ClassSystemState): void {
		this.unlocked = new Set(state.unlockedClasses || []);
		// availablePoints now managed by Player's BloodlineStats
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
		//this.recalculate();
	}
}
