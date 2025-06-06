import { BaseScreen } from "./BaseScreen";
import Markup from "./outposts.html?raw";

export class OutpostsScreen extends BaseScreen {
    readonly screenName = "outposts";

    init() {
        this.addMarkuptoPage(Markup);
    }
    show() {}
    hide() {}
}
