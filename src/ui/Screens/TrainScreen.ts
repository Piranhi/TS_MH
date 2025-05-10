import { BaseScreen } from "./BaseScreen";
import Markup from "./train.html?raw";
import { addHTMLtoPage } from "../utils/ScreensUtils";
import { bus } from "@/core/EventBus";
import { Player } from "@/models/player";
import { TrainedStatDisplay } from "../components/TrainedStatDisplay";

export class TrainScreen extends BaseScreen {

    readonly screenName = 'train';
    private rootEl!: HTMLElement;

    init(){
        this.rootEl = addHTMLtoPage(Markup, this)
        bus.on("Game:UITick", (dt) => this.handleTick(dt));
        this.addStatElements();
    };

    handleTick(dt: number){}
    show(){    
    };
    hide(){};

    addStatElements(){
        const trainingListEl = this.rootEl.querySelector(".training-list") as HTMLElement
        Player.getInstance().trainedStats .forEach(stat => {
            const statHolder = new TrainedStatDisplay(this.rootEl, stat)
            statHolder.init();
        });
    }

}