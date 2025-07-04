import { StatsModifier, Stats, defaultPlayerStats } from "@/models/Stats";
import { bus } from "./EventBus";

export type LayerFn = () => StatsModifier;
export type LayerType = "additive" | "multiplicative";

// Define all possible layers as a const array for order
const LAYER_DEFINITIONS = [
	// Additive layers (processed first)
	{ name: "level", type: "additive" },
	{ name: "equipment", type: "additive" },
	{ name: "abilities", type: "additive" },
	{ name: "classes", type: "additive" },
	// Multiplicative layers (processed after additives)
	{ name: "trainedStats", type: "multiplicative" },
	{ name: "prestige", type: "multiplicative" },
] as const;

// Create a type from the layer names for type safety
export type LayerName = (typeof LAYER_DEFINITIONS)[number]["name"];

/**
 * Generic so you can plug in CoreStats or PlayerStats.
 * S must be an object whose fields are numeric.
 */
export class StatsEngine {
	private layers: Map<LayerName, LayerFn> = new Map();
	private readonly base: Stats;
	private current: Stats;

	constructor() {
		this.base = { ...defaultPlayerStats };
		this.current = { ...defaultPlayerStats };

		// Initialize all layers with empty functions
		for (const layerDef of LAYER_DEFINITIONS) {
			this.layers.set(layerDef.name, () => ({}));
		}

		// Initial calculation
		this.recalculate();
	}

	// Now setLayer only accepts predefined layer names
	setLayer(name: LayerName, fn: LayerFn): void {
		if (!this.layers.has(name)) {
			throw new Error(`Unknown layer: ${name}. Valid layers are: ${Array.from(this.layers.keys()).join(", ")}`);
		}
		this.layers.set(name, fn);
		this.recalculate();
	}

	removeLayer(name: LayerName): void {
		// Reset to empty function instead of deleting
		this.layers.set(name, () => ({}));
		this.recalculate();
	}

	get<K extends keyof Stats>(key: K): Stats[K] {
		return this.current[key] ?? 0;
	}

	getAll(): Stats {
		return { ...this.current };
	}

	private recalculate(): void {
		let result: Stats = { ...this.base };
		const additiveBonus: StatsModifier = {};
		const multiplicativeBonus: StatsModifier = {};

		// Process layers in the defined order
		for (const layerDef of LAYER_DEFINITIONS) {
			const fn = this.layers.get(layerDef.name)!;
			const modifiers = fn();

			if (layerDef.type === "additive") {
				for (const key in modifiers) {
					const statKey = key as keyof Stats;
					const modValue = modifiers[statKey];
					if (modValue !== undefined) {
						additiveBonus[statKey] = (additiveBonus[statKey] || 0) + modValue;
					}
				}
			} else {
				for (const key in modifiers) {
					const statKey = key as keyof Stats;
					const modValue = modifiers[statKey];
					if (modValue !== undefined) {
						multiplicativeBonus[statKey] = (multiplicativeBonus[statKey] || 0) + modValue;
					}
				}
			}
		}

		// Apply formula: (Base + Additive) × (1 + Multiplicative/100)
		for (const key of Object.keys(result) as (keyof Stats)[]) {
			const baseValue = this.base[key] || 0;
			const addBonus = additiveBonus[key] || 0;
			const multBonus = multiplicativeBonus[key] || 0;

			// Clamp to one decimal place
			result[key] = Math.round((baseValue + addBonus) * (1 + multBonus / 100) * 10) / 10;
		}

		this.current = result;
		bus.emit("player:statsChanged");
	}

	// Check if a layer has any modifiers
	public isLayerActive(name: LayerName): boolean {
		const fn = this.layers.get(name);
		return fn ? Object.keys(fn()).length > 0 : false;
	}

	// Clear all modifiers from a specific layer
	public clearLayer(name: LayerName): void {
		this.setLayer(name, () => ({}));
	}

	// Get modifiers from a specific layer
	public getLayerModifiers(name: LayerName): StatsModifier {
		const fn = this.layers.get(name);
		return fn ? fn() : {};
	}

	// --------------------- DEBUG METHODS -----------------------

	public printStats(): void {
		console.table(this.getAll());
	}

	public debugLayers(): void {
		console.group("Stats Engine Layers (in processing order)");

		for (const layerDef of LAYER_DEFINITIONS) {
			const fn = this.layers.get(layerDef.name)!;
			const stats = fn();
			const hasStats = Object.keys(stats).length > 0;

			console.log(`${layerDef.name} (${layerDef.type}):`, hasStats ? stats : "empty");
		}

		console.log("Final Stats:", this.current);
		console.groupEnd();
	}

	public getFullBreakdown(): {
		base: Stats;
		layers: Record<string, StatsModifier>;
		total: Stats;
	} {
		const layers: Record<string, StatsModifier> = {};

		// Include all layers, even empty ones
		for (const layerDef of LAYER_DEFINITIONS) {
			const fn = this.layers.get(layerDef.name)!;
			layers[layerDef.name] = { ...fn() };
		}

		return {
			base: { ...this.base },
			layers,
			total: { ...this.current },
		};
	}
}
