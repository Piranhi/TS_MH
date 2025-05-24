import { GameSave, Saveable } from "@/shared/storage-types";
import { reviveGame } from "@/storage/reviver";
import { bus } from "./EventBus";
import { GameContext } from "./GameContext";

export class SaveManager {
	private readonly SAVE_KEY = "monster-hunter-save";

	private registry = new Map<string, Saveable<unknown>>();
	private saveData?: GameSave;

	constructor() {
		// Autosave every 30 seconds
		setInterval(() => {
			this.saveAll();
		}, 30000);
	}

	register<T>(key: string, system: Saveable<T>): void {
		if (this.registry.has(key)) throw new Error(`Duplicate save key: ${key}`);
		this.registry.set(key, system);

		/* ── NEW: if we already loaded a slice for this key, hand it over now ── */
		const slice = this.saveData?.[key];
		if (slice !== undefined) system.load(slice as T);
	}

	// Used for transient systems
	// Checks for new run to prevent hydrating old data (e.g. After prestige, create new HuntManager, Register but don't hydrate.)
	updateRegister<T>(key: string, system: Saveable<T>) {
		this.registry.set(key, system); // overwrite
		const context = GameContext.getInstance();

		// Hydrate only if NOT new run
		if (!context.flags.isNewRun) {
			// If we still have its slice cached, hydrate once
			const slice = this.saveData?.[key];
			if (slice !== undefined) system.load(slice as T);
		}
	}

	saveAll(): GameSave {
		const out: GameSave = { _version: 1, _timestamp: Date.now() };
		for (const [key, system] of this.registry) {
			out[key] = system.save();
		}
		localStorage.setItem(this.SAVE_KEY, JSON.stringify(out));
		console.log("Game Saved.");
		bus.emit("game:gameSaved");

		return (this.saveData = out);
	}

	loadAll(): boolean {
		const raw = localStorage.getItem(this.SAVE_KEY);
		if (!raw || raw === "undefined") return false;

		//let data: GameSave;
		try {
			this.saveData = JSON.parse(raw, reviveGame) as GameSave;
		} catch (err) {
			console.error("[SaveManager] could not parse save data:", err);
			return false;
		}

		/* Hydrate only the systems that already exist */
		for (const [key, sys] of this.registry) {
			const slice = this.saveData[key];
			if (slice !== undefined) sys.load(slice);
		}
		bus.emit("game:gameLoaded");
		console.log("[Save Manager] Game Loaded");
		return true;
	}

	clearSaves(): void {
		//localStorage.removeItem(this.SAVE_KEY);
	}

	startNewGame(): void {
		localStorage.removeItem(this.SAVE_KEY);
		window.location.reload();
	}
}
export const saveManager = new SaveManager();
