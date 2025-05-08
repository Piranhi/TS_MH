import { BaseScreen } from "./BaseScreen";
import Markup from "./train.html?raw";
import { addHTMLtoPage } from "./ScreensUtils";
import { bus } from "@/EventBus";
import { player } from "@/player";
import { TrainedStatHolder } from "../features/TrainedStat/ui/TrainedStatHolder";

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
        player.trainedStats .forEach(stat => {
            const statHolder = new TrainedStatHolder(this.rootEl, stat)
            statHolder.init();
        });
    }

}