import { Saveable } from "@/shared/storage-types";

/** Possible operations a layer can perform */
export type ModifierOp = "add" | "mul";

/** Configuration describing a single layer */
export interface ModifierLayerConfig {
	/** Unique name used to reference this layer */
	name: string;
	/** Whether values are added or multiplied */
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

/** Serialized representation of a layer */
interface LayerSave {
	entries: [string, number][];
}

/** Serialized representation of a system */
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
class ModifierSystem {
	private base: number;
	private layers: Record<string, ModifierLayer> = {};
	private cached = 0;

	constructor(private layerConfig: ModifierLayerConfig[], settings: ModifierSystemSettings) {
		this.base = settings.base;
		for (const l of layerConfig) {
			this.layers[l.name] = new ModifierLayer(l.op);
		}
		this.recalculate();
	}

	add(layer: string, key: string, value: number) {
		this.layers[layer]?.add(key, value);
		this.recalculate();
	}

	clearLayer(layer: string) {
		this.layers[layer]?.clear();
		this.recalculate();
	}

	recalculate(disabled?: Set<string>) {
		let val = this.base;
		for (const cfg of this.layerConfig) {
			if (disabled?.has(cfg.name)) continue;
			const layer = this.layers[cfg.name];
			const total = layer.total;
			val = cfg.op === "add" ? val + total : val * total;
		}
		this.cached = val;
	}

	value(disabled?: Set<string>): number {
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

	getBreakdown(disabled?: Set<string>): { name: string; after: number }[] {
		const result: { name: string; after: number }[] = [];
		let val = this.base;
		for (const cfg of this.layerConfig) {
			if (disabled?.has(cfg.name)) {
				result.push({ name: cfg.name + " (disabled)", after: val });
				continue;
			}
			const layer = this.layers[cfg.name];
			const total = layer.total;
			val = cfg.op === "add" ? val + total : val * total;
			result.push({ name: cfg.name, after: val });
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
	private systems: Record<string, ModifierSystem> = {};
	private disabledLayers = new Set<string>();

	constructor(private config: ModifierConfig) {
		for (const [name, settings] of Object.entries(config.systems)) {
			this.systems[name] = new ModifierSystem(config.layers, settings);
		}
	}

	/** Add a value to a system's layer */
	addModifier(system: string, layer: string, key: string, value: number) {
		this.systems[system]?.add(layer, key, value);
	}

	/** Remove all values from a system's layer */
	clearLayer(system: string, layer: string) {
		this.systems[system]?.clearLayer(layer);
	}

	/** Enable or disable a layer across all systems */
	setLayerEnabled(layer: string, enabled: boolean) {
		if (enabled) this.disabledLayers.delete(layer);
		else this.disabledLayers.add(layer);
		// Recalculate cached values
		for (const sys of Object.values(this.systems)) sys.recalculate(this.disabledLayers);
	}

	/** Retrieve the current value for a system */
	getValue(system: string): number {
		return this.systems[system]?.value(this.disabledLayers) ?? 0;
	}

	/** Print a breakdown of all systems and layers to the console */
	printDebug() {
		for (const [name, sys] of Object.entries(this.systems)) {
			console.log(`--- ${name} ---`);
			const breakdown = sys.getBreakdown(this.disabledLayers);
			breakdown.forEach((b) => console.log(`${b.name}: ${b.after.toString()}`));
			console.log(`Total: ${sys.value(this.disabledLayers).toString()}`);
		}
	}

	save(): ModifierEngineSave {
		const systems: Record<string, SystemSave> = {};
		for (const [name, sys] of Object.entries(this.systems)) {
			systems[name] = sys.toJSON();
		}
		return { systems };
	}

	load(state: ModifierEngineSave): void {
		for (const [name, settings] of Object.entries(this.config.systems)) {
			const slice = state.systems?.[name];
			const sys = new ModifierSystem(this.config.layers, settings);
			if (slice) sys.load(settings, slice);
			this.systems[name] = sys;
		}
	}
}

