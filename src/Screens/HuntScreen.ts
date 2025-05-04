import { BaseScreen } from "./BaseScreen";
import Markup from "./hunt.html?raw";
import { bus } from "../EventBus";
import { HuntState } from "../HuntManager";

export class HuntScreen extends BaseScreen {
	readonly screenName = "hunt";
    private huntUpdateEl: HTMLElement;
    private readonly MAX_LOG_LINES = 50;

	init() {
		const tpl = document.createElement("template");
		tpl.innerHTML = Markup.trim();

		const huntElement = tpl.content.firstElementChild as HTMLElement | null;
		if (!huntElement) {
			throw new Error("Settlement template is empty");
		}
		this.element.append(huntElement);
        this.huntUpdateEl = document.getElementById("hunt-update")!;

		bus.on("hunt:stateChanged", (state) => this.areaChanged(state));
        bus.on("combat:started", (combat) => {
            this.updateOutput(`${combat.player.getName()} is in combat with ${combat.enemy.getName()}`);
        })
        bus.on("combat:ended", (result) => {
            this.updateOutput(result);
        })

		document.getElementById("area-select")!.addEventListener("change", (e) => {
			const areaId = (e.target as HTMLSelectElement).value;
			bus.emit("hunt:areaSelected", areaId);
		});
	}
	show() {}
	hide() {}

    areaChanged(state: HuntState){
        switch (state){
            case HuntState.Idle:
                break
            case HuntState.Search:
                this.enterSearch();
                break;
            case HuntState.Combat:
                this.enterCombat();
                break;
            case HuntState.Recovery:
                this.enterRecovery();
                break;
        }
    }

    enterSearch(){
        this.updateOutput("Searching the area")

    }

    enterCombat(){
        this.updateOutput("In combat")
    }

    enterRecovery(){
        this.updateOutput("In Recovery")
    }

    private updateOutput(s: string){
        const li = document.createElement("li")
        li.textContent = s;
        this.huntUpdateEl.append(li)

        while(this.huntUpdateEl.children.length > this.MAX_LOG_LINES){
            this.huntUpdateEl.removeChild(this.huntUpdateEl.firstElementChild!)
        }
    }
}
