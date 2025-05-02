import { BaseScreen } from "./BaseScreen";

export class InventoryScreen extends BaseScreen {

    readonly screenName = 'inventory'

    init(){
        this.element.textContent = 'Inventory Screen';
    };
    show(){};
    hide(){};

}