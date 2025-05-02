import { bus } from "./EventBus"; 
import { Bounded } from "./domain/value-objects/Bounded";

export class ResourceManager{

    public renown: Bounded = {current: 0, min: 0, max:100};

    constructor(){
        bus.on('Game:GameTick', (dt) => this.handleTick(dt))
        console.log("Starting Resource Manager")
    }

    private handleTick(dt: number){
        this.modifyRenown(dt)
    }

    public modifyRenown(delta: number){
        this.renown.current = Math.min((this.renown.current + delta), this.renown.max);
        bus.emit('Renown:Changed', this.renown);
    }


}

export const resourceManager:ResourceManager = new ResourceManager();