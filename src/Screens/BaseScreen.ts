import { Screen } from "../screen";

export abstract class BaseScreen implements Screen{
    public element = document.createElement('div');
    constructor() {this.element.classList.add('screen');}
    abstract init(): void;
    abstract show(): void;
    abstract hide(): void;
    update?(deltaMs: number):void;
}