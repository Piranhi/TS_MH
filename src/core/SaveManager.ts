import { GameSave, Saveable } from "@/shared/storage-types";
import { reviveGame } from "@/storage/reviver";
import { bus } from "./EventBus";

export class SaveManager {
	private readonly SAVE_KEY = "monster-hunter-save";
	private registry = new Map<string, Saveable<any>>();

	constructor() {
		setInterval(() => {
			this.saveAll();
		}, 30000);
	}

	register(key: string, system: Saveable): void {
		if (this.registry.has(key)) {
			throw new Error(`Duplicate save key: ${key}`);
		}
		this.registry.set(key, system);
		console.log("Registered");
	}

	saveAll(): GameSave {
		const out: GameSave = { _version: 1, _timestamp: Date.now() };
		for (const [key, system] of this.registry) {
			out[key] = system.save();
		}
		localStorage.setItem(this.SAVE_KEY, JSON.stringify(out));
		console.log("Game Saved.");
		bus.emit("game:gameSaved");

		return out;
	}

	loadAll(): void {
		const raw = localStorage.getItem(this.SAVE_KEY);
		console.log("[SaveManager] raw from storage:", raw);
		if (!raw || raw === "undefined") return;

		let data: GameSave;
		try {
			data = JSON.parse(raw, reviveGame) as GameSave;
			if (data == null) {
				throw new Error("parsed data is null or undefined");
			}
		} catch (err) {
			//console.error("[SaveManager] could not parse save data:", err);
			return;
		}

		for (const [key, sys] of this.registry) {
			if (!(key in data)) continue;
			//console.log(`…loading slice "${key}":`, data[key]);
			sys.load(data[key]);
		}

		bus.emit("game:gameLoaded");
	}

	startNewGame(): void {
		localStorage.removeItem(this.SAVE_KEY);
		window.location.reload();
	}
}
export const saveManager = new SaveManager();
