import { BaseScreen } from "./BaseScreen";

export class SettlementScreen extends BaseScreen {

    readonly screenName = 'settlement'


    init(){
        this.element.textContent = 'Settlement Screen';
    };
    show(){};
    hide(){};

}