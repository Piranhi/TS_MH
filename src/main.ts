import { GameApp } from "./core/GameApp";

(async () => {
	const el = document.getElementById("app") as HTMLElement;
	const app = new GameApp(el);
	await app.init();
})();
