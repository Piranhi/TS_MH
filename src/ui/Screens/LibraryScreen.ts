import { BaseScreen } from "./BaseScreen";
import Markup from "./library.html?raw";
import { ProgressBar } from "../components/ProgressBar";
import { bindEvent } from "@/shared/utils/busUtils";
import { ResearchUpgrade } from "@/features/settlement/ResearchUpgrade";

export class LibraryScreen extends BaseScreen {
    readonly screenName = "library";
    private activeList!: HTMLElement;
    private upgradeGrid!: HTMLElement;
    private completedList!: HTMLElement;

    init() {
        this.addMarkuptoPage(Markup);
        this.activeList = this.byId("libraryActiveList");
        this.upgradeGrid = this.byId("libraryUpgradeGrid");
        this.completedList = this.byId("libraryCompletedList");
        this.build();
        bindEvent(this.eventBindings, "library:changed", () => this.build());
        bindEvent(this.eventBindings, "Game:UITick", () => this.updateActive());
    }
    show() {}
    hide() {}

    private build() {
        this.updateActive();
        this.updateAvailable();
        this.updateCompleted();
    }

    private updateActive() {
        const active = this.context.library.getActive();
        this.activeList.innerHTML = "";
        active.forEach((upg) => {
            const row = document.createElement("div");
            row.className = "library-research-row";
            const icon = document.createElement("div");
            icon.className = "library-research-icon";
            icon.textContent = "📖";
            row.appendChild(icon);
            const info = document.createElement("div");
            info.className = "library-research-info";
            const title = document.createElement("span");
            title.className = "library-research-title";
            title.textContent = upg.name;
            info.appendChild(title);
            const progressContainer = document.createElement("div");
            progressContainer.className = "library-research-progress";
            info.appendChild(progressContainer);
            new ProgressBar({
                container: progressContainer,
                maxValue: upg.requiredTime,
                initialValue: upg.progress,
            });
            row.appendChild(info);
            this.activeList.appendChild(row);
        });
    }

    private updateAvailable() {
        const avail = this.context.library.getAvailable();
        this.upgradeGrid.innerHTML = "";
        avail.forEach((upg) => {
            const card = document.createElement("div");
            card.className = "library-upgrade-card";
            const name = document.createElement("div");
            name.className = "library-upgrade-title";
            name.textContent = upg.name;
            card.appendChild(name);
            card.addEventListener("click", () => this.context.library.startResearch(upg.id));
            this.upgradeGrid.appendChild(card);
        });
    }

    private updateCompleted() {
        const list = this.context.library.getCompleted();
        this.completedList.innerHTML = "";
        list.forEach((id) => {
            const spec = ResearchUpgrade.getSpec(id);
            const li = document.createElement("li");
            li.textContent = spec ? spec.name : id;
            this.completedList.appendChild(li);
        });
    }
}
