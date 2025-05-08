import { GameApp } from "./GameApp";
import { initGameData } from "./gameData";
import { Player } from "./player";


(async () =>{
  initGameData();
  const player = Player.getInstance();

  
  const el = document.getElementById("app") as HTMLElement;
  const app = new GameApp(el);
  await app.init('settlement');
})();

