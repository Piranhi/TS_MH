import { bus } from "./EventBus";

class GameEngine {
    private lastTs = performance.now();
    private lastSecond = new Date().getTime() / 1000;
    private gameLoopLeftOver = 0;

    constructor(){};

    start(){
        requestAnimationFrame(() => this.UIloop())
        setInterval(() => this.gameloop(), 1000)
        console.log("Starting Engine")
    }

    private UIloop(){
        const now = performance.now();
        const dt = (now - this.lastTs) / 1000; // seconds;
        this.lastTs = now;
        bus.emit('Game:UITick', dt);
        requestAnimationFrame(() => this.UIloop())
    }

    private gameloop(){
        const now = new Date().getTime() / 1000;
        const dt = now - this.lastSecond;
        this.lastSecond = now;
        this.gameLoopLeftOver += dt;
        
        const wholeSeconds = Math.floor(this.gameLoopLeftOver);

        if(wholeSeconds >= 1){
            bus.emit('Game:GameTick', wholeSeconds);
        }

        this.gameLoopLeftOver -= wholeSeconds;
    }
}

export const engine = new GameEngine();