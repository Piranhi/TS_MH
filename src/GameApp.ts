import { GameScreen } from "./gameScreen";
import { ScreenManager } from "./ScreenManager";
import { ScreenName } from "./types";

class GameApp{
    private manager = new ScreenManager<ScreenName>();
    private screens: GameScreen[] = [];
    private containter = document.getElementById('game-area')!;
    private navContainer = document.getElementById('sidebar')!;

    constructor(private screenFactories: Record<ScreenName, () => GameScreen>){}

    // Register all screens with the manager and keep instances around */
    private registerScreens(){
        for (const [name, factory] of Object.entries(this.screenFactories) as [ScreenName, ()=>GameScreen][]){
            const screen = factory();
            this.manager.register(name, screen);
            this.screens.push(screen);
        }
    }

    // Mount & init every screen exactly once, hidden by default
    private mountScreens(){
        for (const screen of this.screens){
            this.containter.append(screen.element);
            screen.init();
            screen.element.classList.remove('active');
        }
    }

    // Build the sidebar UI and wire up clicks to show()
    private buildNav(){
        for (const name of Object.keys(this.screenFactories) as ScreenName[]){
            const btn = document.createElement('button');
            btn.textContent = this.prettify(name);
            btn.addEventListener('click', () => this.manager.show(name));
            this.navContainer.append(btn);
        }
    }

    // helper to make “settlement” → “Settlement
    private prettify(name: string){
        return name[0].toUpperCase() + name.slice(1);
    }

    public async init(home: ScreenName){
        this.registerScreens();
        this.mountScreens();
        this.buildNav();
        await this.manager.show(home);
    }
}