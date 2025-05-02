import { bus } from "../EventBus";
import { Bounded } from "../domain/value-objects/Bounded";

export class UIHeader{

    constructor(
        private container: HTMLElement){}

        private elRenown: HTMLElement = document.getElementById('renown')!;
    

    public build(){
        bus.on('Renown:Changed', (renown) => this.updateRenown(renown))
        this.elRenown.textContent = "boo";
    }

    private updateRenown(renown: Bounded){
        this.elRenown.textContent = `${renown.current.toString()} / ${renown.max.toString()}`;
        console.log(renown)
    }
}