import { ScreenManager } from "./ScreenManager";
import { ScreenName } from "./types";
import { GameScreen } from "./gameScreen";

// Import game screens
import {SettlementScreen} from "./Screens/SettlementScreen";
import {HuntScreen} from "./Screens/HuntScreen";
import { BlacksmithScreen } from "./Screens/BlacksmithScreen";
import { CharacterScreen } from "./Screens/CharacterScreen";
import { InventoryScreen } from "./Screens/InventoryScreen";
import { ResearchScreen } from "./Screens/ResearchScreen";
import { TrainScreen } from "./Screens/TrainScreen";



const manager = new ScreenManager();
const gameScreenInstances: GameScreen[] = [];
const container = document.getElementById('game-area')!;
// Screen Factory
const screenFactories: Record< ScreenName, () => GameScreen> = {
  settlement:   () => new SettlementScreen(),
  hunt:         () => new HuntScreen(),
  blacksmith:   () => new BlacksmithScreen(),
  character:    () => new CharacterScreen(),
  inventory:    () => new InventoryScreen(),
  research:     () => new ResearchScreen(),
  train:        () => new TrainScreen()
}

for (const name of Object.keys(screenFactories) as ScreenName[]){
  const gameScreen = screenFactories[name]();
  manager.register(name, gameScreen)
  gameScreenInstances.push(gameScreen);
}
for(const gameScreen of gameScreenInstances){
  container.appendChild(gameScreen.element);
  gameScreen.init();
  gameScreen.element.classList.remove('active')
}

await manager.show('settlement');
const menuContent = document.querySelector<HTMLDivElement>('.menu-content')!;
const gameContainer = document.querySelector<HTMLDivElement>('.game')!;

const sidebar = document.getElementById('sidebar')!;
const ul = sidebar.querySelector('.sidebar') as HTMLUListElement
for (const name of Object.keys(screenFactories) as ScreenName[]){
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  btn.addEventListener('click', () => {
    console.log('Clicked', name)
    manager.show(name)
});
  li.appendChild(btn);
  ul.appendChild(li);
}

