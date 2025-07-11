import { Saveable } from "@/shared/storage-types";
import { bus } from "./EventBus";

export type ModifierOp = "add" | "mul";

/** Strict types for systems and layers */
export const ALL_MODIFIER_SYSTEMS = ["researchSpeed", "blacksmithSpeed", "trainingSpeed", "equipmentQuality"] as const;
export type ModifierSystem = (typeof ALL_MODIFIER_SYSTEMS)[number];

export const ALL_MODIFIER_LAYERS = ["building", "equipment", "run", "permanent", "prestige", "challenge"] as const;
export type ModifierLayerName = (typeof ALL_MODIFIER_LAYERS)[number];

/** Configuration describing a single layer */
export interface ModifierLayerConfig {
	name: ModifierLayerName;
	op: ModifierOp;
}

/** Per-system configuration */
export interface ModifierSystemSettings {
	/** Base value before any layers are applied */
	base: number;
}

/** Full engine configuration */
export interface ModifierConfig {
	/** Ordered list of layers shared by every system */
	layers: ModifierLayerConfig[];
	/** Map of system id to initial settings */
	systems: Record<string, ModifierSystemSettings>;
}

interface LayerSave {
	entries: [string, number][];
}

interface SystemSave {
	base: number;
	layers: Record<string, LayerSave>;
}

export interface ModifierEngineSave {
	systems: Record<string, SystemSave>;
}

/**
 * A single layer of modifiers. Depending on its configured operation it will
 * either sum or multiply its stored values.
 */
class ModifierLayer {
	private values = new Map<string, number>();

	constructor(public readonly op: ModifierOp) {}

	add(key: string, value: number) {
		this.values.set(key, value);
	}

	clear() {
		this.values.clear();
	}

	/** Compute the layer's total according to its op */
	get total(): number {
		if (this.op === "add") {
			let t = 0;
			for (const v of this.values.values()) t += v;
			return t;
		} else {
			let t = 1;
			for (const v of this.values.values()) t *= v;
			return t;
		}
	}

	toJSON(): LayerSave {
		return { entries: Array.from(this.values.entries()) };
	}

	static fromJSON(op: ModifierOp, raw: LayerSave): ModifierLayer {
		const layer = new ModifierLayer(op);
		raw.entries?.forEach(([k, v]) => layer.values.set(k, v));
		return layer;
	}
}

/** Represents all layers for a particular system */
class ModifierSystemClass {
	private base: number;
	private layers: Record<ModifierLayerName, ModifierLayer> = {} as Record<ModifierLayerName, ModifierLayer>;
	private cached = 0;

	constructor(private layerConfig: ModifierLayerConfig[], settings: ModifierSystemSettings) {
		this.base = settings.base;
		for (const l of layerConfig) {
			this.layers[l.name] = new ModifierLayer(l.op);
		}
		this.recalculate();
	}

	add(layer: ModifierLayerName, key: string, value: number) {
		this.layers[layer]?.add(key, value);
		this.recalculate();
	}

	clearLayer(layer: ModifierLayerName) {
		this.layers[layer]?.clear();
		this.recalculate();
	}

	recalculate(disabled?: Set<ModifierLayerName>) {
		let val = this.base;
		for (const config of this.layerConfig) {
			if (disabled?.has(config.name)) continue;
			const layer = this.layers[config.name];
			const total = layer.total;
			val = config.op === "add" ? val + total : val * total;
		}
		this.cached = val;
		bus.emit("modifier:recalculated");
	}

	value(disabled?: Set<ModifierLayerName>): number {
		if (disabled && disabled.size > 0) {
			// Recalculate on the fly for disabled layers
			let val = this.base;
			for (const cfg of this.layerConfig) {
				if (disabled.has(cfg.name)) continue;
				const layer = this.layers[cfg.name];
				const total = layer.total;
				val = cfg.op === "add" ? val + total : val * total;
			}
			return val;
		}
		return this.cached;
	}

	getBreakdown(disabled?: Set<ModifierLayerName>): { name: string; after: number }[] {
		const result: { name: string; after: number }[] = [];
		let val = this.base;
		for (const config of this.layerConfig) {
			if (disabled?.has(config.name)) {
				result.push({ name: config.name + " (disabled)", after: val });
				continue;
			}
			const layer = this.layers[config.name];
			const total = layer.total;
			val = config.op === "add" ? val + total : val * total;
			result.push({ name: config.name, after: val });
		}
		return result;
	}

	toJSON(): SystemSave {
		const layers: Record<string, LayerSave> = {};
		for (const [name, layer] of Object.entries(this.layers)) {
			layers[name] = layer.toJSON();
		}
		return { base: this.base, layers };
	}

	load(settings: ModifierSystemSettings, raw: SystemSave) {
		this.base = raw.base;
		for (const cfg of this.layerConfig) {
			const slice = raw.layers[cfg.name] ?? { entries: [] };
			this.layers[cfg.name] = ModifierLayer.fromJSON(cfg.op, slice);
		}
		this.recalculate();
	}
}

/**
 * Central modifier engine used by the game. It maintains multiple systems and
 * supports save/load. Layers can be temporarily disabled (e.g. for challenges)
 * and cleared (e.g. upon prestige).
 */
export class ModifierEngine implements Saveable<ModifierEngineSave> {
	private systems: Record<ModifierSystem, ModifierSystemClass> = {
		researchSpeed: undefined!,
		blacksmithSpeed: undefined!,
		trainingSpeed: undefined!,
		equipmentQuality: undefined!,
	};
	private disabledLayers = new Set<ModifierLayerName>();

	constructor(private config: ModifierConfig) {
		for (const sys of ALL_MODIFIER_SYSTEMS) {
			const settings = config.systems[sys];
			if (settings) {
				this.systems[sys] = new ModifierSystemClass(config.layers, settings);
			}
		}
	}

	private getSystem(sys: ModifierSystem): ModifierSystemClass {
		return this.systems[sys];
	}

	/** Add a value to a system's layer */
	addModifier(system: ModifierSystem, layer: ModifierLayerName, key: string, value: number) {
		this.getSystem(system)?.add(layer, key, value);
		bus.emit("modifier:changed", system);
	}

	/** Remove all values from a system's layer */
	clearLayer(system: ModifierSystem, layer: ModifierLayerName) {
		this.getSystem(system)?.clearLayer(layer);
		bus.emit("modifier:changed", system);
	}

	/** Enable or disable a layer across all systems */
	setLayerEnabled(layer: ModifierLayerName, enabled: boolean) {
		if (enabled) this.disabledLayers.delete(layer);
		else this.disabledLayers.add(layer);
		// Recalculate cached values
		for (const sysName of ALL_MODIFIER_SYSTEMS) {
			const sys = this.getSystem(sysName);
			if (sys) sys.recalculate(this.disabledLayers);
		}
		bus.emit("modifier:changed", null);
	}

	/** Retrieve the current value for a system */
	getValue(system: ModifierSystem): number {
		return this.getSystem(system)?.value(this.disabledLayers) ?? 0;
	}

	/** Print a breakdown of all systems and layers to the console */
	printDebug() {
		for (const sysName of ALL_MODIFIER_SYSTEMS) {
			const sys = this.getSystem(sysName);
			if (!sys) continue;
			console.log(`--- ${sysName} ---`);
			const breakdown = sys.getBreakdown(this.disabledLayers);
			breakdown.forEach((b) => console.log(`${b.name}: ${b.after.toString()}`));
			console.log(`Total: ${sys.value(this.disabledLayers).toString()}`);
		}
	}

	save(): ModifierEngineSave {
		const systems: Record<string, SystemSave> = {};
		for (const sysName of ALL_MODIFIER_SYSTEMS) {
			const sys = this.getSystem(sysName);
			if (sys) systems[sysName] = sys.toJSON();
		}
		return { systems };
	}

	load(state: ModifierEngineSave): void {
		for (const sysName of ALL_MODIFIER_SYSTEMS) {
			const settings = this.config.systems[sysName];
			const slice = state.systems?.[sysName];
			const sys = new ModifierSystemClass(this.config.layers, settings);
			if (slice) sys.load(settings, slice);
			this.systems[sysName] = sys;
		}
	}
}
