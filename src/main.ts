import { GameApp } from "./core/GameApp";
import { StoryModalManager } from "@/ui/components/StoryModal";

(async () => {
	const el = document.getElementById("app") as HTMLElement;
	// Initialize story modal manager to listen for progression events
	StoryModalManager.init();
	const app = new GameApp(el);
	await app.init();
})();
