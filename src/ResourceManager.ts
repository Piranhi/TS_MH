import { bus } from "./EventBus"; 
import { Bounded } from "./domain/value-objects/Bounded";

export class ResourceManager{

    //public renown = new Bounded(0,100,0);

    constructor(){
        bus.on('Game:GameTick', (dt) => this.handleTick(dt))
        console.log("Starting Resource Manager")
    }

    private handleTick(dt: number){
    }



}

export const resourceManager:ResourceManager = new ResourceManager();