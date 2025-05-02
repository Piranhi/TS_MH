import { bus } from "./EventBus";
import { engine } from "./GameEngine";
import { GameScreen } from "./gameScreen";
import { ScreenManager } from "./ScreenManager";
import { Sidebar } from "./ui/Sidebar";
import "./ui/Header";
import { ScreenName } from "./types";
import { UIHeader } from "./ui/Header";
import "./ResourceManager";

export class GameApp{
    private manager = new ScreenManager<ScreenName>();
    private sidebar: Sidebar;
    private header: UIHeader;

    private screens: GameScreen[] = [];
    private containter = document.getElementById('game-area')!;


    constructor(private screenFactories: Record<ScreenName, () => GameScreen>){
        this.sidebar = new Sidebar(
            document.getElementById("sidebar")!,
            Object.keys(screenFactories) as ScreenName[],
            (name) => this.manager.show(name)
        )
        this.header = new UIHeader(document.getElementById("header")!);
    }

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


    public async init(home: ScreenName){
        this.registerScreens();
        this.mountScreens();
        this.sidebar.build();
        this.header.build();
        await this.manager.show(home);
        engine.start();
    }
}