import { BaseScreen } from "../Screens/BaseScreen";

export function addHTMLtoPage(markup: string, screen: BaseScreen): HTMLElement {
    const tpl = document.createElement("template");
    tpl.innerHTML = markup.trim();
    const element = tpl.content.firstElementChild as HTMLElement | null;
    if (!element) {
        throw new Error("Settlement template is empty");
    }
    screen.element.append(element);
    return element
}