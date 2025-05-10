import { bus } from "./EventBus";

class GameEngine {
    //100ms = 10hz
    private readonly logicInterval = 100;

    private lastTs = performance.now();

    private logicAccumulator = 0;

    private lastSecond = new Date().getTime() / 1000;
    private gameLoopLeftOver = 0;

    constructor(){};

    start(){
        this.lastTs = performance.now();
        requestAnimationFrame(this.loop.bind(this));
        console.log("Starting Engine")
    }

    private loop(now: number){
        const dt = now - this.lastTs
        this.lastTs = now;

        this.logicAccumulator += dt;

        while (this.logicAccumulator >= this.logicInterval){
            bus.emit("Game:GameTick", this.logicInterval/1000);
            this.logicAccumulator -= this.logicInterval;
        }

        bus.emit('Game:UITick', dt / 1000);
        requestAnimationFrame(this.loop.bind(this))
    }

}

export const engine = new GameEngine();