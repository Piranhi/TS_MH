import { ScreenManager } from "./ScreenManager";
import {SettlementScreen} from "./Screens/SettlementScreen";
import { HuntScreen } from "./Screens/HuntScreen";

const manager = new ScreenManager();

manager.register('settlement', new SettlementScreen());
manager.register('hunt', new HuntScreen())

manager.show('settlement');

// 1) Grab typed references to our DOM nodes.
//    <HTMLButtonElement> is a TS generic telling querySelectorAll what element type to expect.
const menuButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.menu-buttons button')
);
const menuContent = document.querySelector<HTMLDivElement>('.menu-content')!;
const gameContainer = document.querySelector<HTMLDivElement>('.game')!;

// 2) Dummy data for menu sections
const menuSections: Record<string, string> = {
  Inventory: 'Your items will show up here.',
  Quests: 'Quest log is empty.',
  Settings: 'Adjust your preferences here.',
};

// 3) When a menu button is clicked, mark it active and swap content
menuButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // remove .active from all, then add to our clicked button
    menuButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // lookup our dummy text by button label
    const text = menuSections[btn.textContent || ''] || '';
    menuContent.textContent = text;
  });
});

/* // 4) Populate the game area with 30 demo “game-item” divs
for (let i = 1; i <= 30; i++) {
  const item = document.createElement('div');
  item.className = 'game-item';
  item.textContent = `Monster ${i}`;
  gameContainer.appendChild(item);
}

// 5) Kick things off by clicking the first menu button
menuButtons[0]?.click(); */
