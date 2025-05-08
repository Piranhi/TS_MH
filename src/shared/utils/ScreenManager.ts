import { GameScreen } from "../../Screens/gameScreen";
import {ScreenName} from "../types/types"

type Loader<T> = () => Promise<T>;

export class ScreenManager<Name extends ScreenName>{
    private current?: GameScreen;
    private registry = new Map<
    Name,
    GameScreen | Loader<GameScreen>
    >();

      /** Register either an already-constructed Screen, or a loader that returns one */
    register(name: Name, screenOrLoader: GameScreen | Loader<GameScreen>){
        this.registry.set(name, screenOrLoader)
    }

      /** Switch to a screen by name */
    async show(name: Name){
        // Hide the current
        if (this.current){
            this.current.hide();
            this.current.element.classList.remove('active');
        }

        // Fetch or reuse
        let entry = this.registry.get(name);
        if(!entry) throw new Error(`No screen: ${name}`);

        let screen: GameScreen;
        if (typeof entry === 'function'){
            // lazy loader
            screen = await entry();
            this.registry.set(name, screen) // Replace the loader with the real screen
        } else {
            screen = entry;
        }

        // Init once
        if (!screen.element.isConnected){
            document.getElementById('game-area')!.append(screen.element);
            screen.init()
        }

        // Show
        screen.element.classList.add('active');
        screen.show();
        this.current = screen;
    }
}