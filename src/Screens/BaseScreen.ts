import { GameScreen } from "../gameScreen";
import { ScreenName } from "../types";

export abstract class BaseScreen implements GameScreen{
    abstract readonly screenName: ScreenName;

    public element = document.createElement('div');

    constructor() {
        this.element.classList.add('screen');
    }

    abstract init(): void;
    abstract show(): void;
    abstract hide(): void;
    update?(deltaMs: number):void;
}