import { GameApp } from "./GameApp";
import "@/gameData";


(async () =>{
  const el = document.getElementById("app") as HTMLElement;
  const app = new GameApp(el);
  await app.init('settlement');
})();

