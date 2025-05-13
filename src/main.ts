import { saveManager } from "./core/SaveManager";
import { GameApp } from "./core/GameApp";
import { initGameData } from "./core/gameData";
import { Player } from "./models/player";

(async () => {
    //saveManager.noOp();
    initGameData();
    const player = Player.getInstance();

    const el = document.getElementById("app") as HTMLElement;
    const app = new GameApp(el);
    await app.init("settlement");
    saveManager.loadAll();
})();
