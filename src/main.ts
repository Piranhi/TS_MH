import { GameApp } from "./GameApp";
import { screenFactories } from "./screenFactories";

(async () =>{
  const app = new GameApp(screenFactories);
  await app.init('settlement');
})();
