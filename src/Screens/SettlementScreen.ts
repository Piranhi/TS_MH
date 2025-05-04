import { BaseScreen } from "./BaseScreen";
import settlementMarkup from './settlement.html?raw';

export class SettlementScreen extends BaseScreen {

    readonly screenName = 'settlement'


    init(){
        const tpl = document.createElement('template');
        tpl.innerHTML = settlementMarkup.trim();

        const firstChild = tpl.content.firstElementChild as HTMLElement | null;
        if(!firstChild){
            throw new Error("Settlement template is empty");
        }
        this.element.append(firstChild);
        
    };
    show(){};
    hide(){};

}