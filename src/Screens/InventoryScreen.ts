import { InventoryManager } from "@/features/inventory/InventoryManager";
import { Player } from "@/player";
import { BaseScreen } from "./BaseScreen";
import { addHTMLtoPage } from "./ScreensUtils";
import Markup from "./inventory.html?raw";
import { InventoryItem } from "@/shared/types";

export class InventoryScreen extends BaseScreen {

    readonly screenName = 'inventory'
    private rootEl!: HTMLElement;
    private inventoryGridEl!: HTMLElement;
    private player: Player = Player.getInstance();
    


    init(){
        this.element.textContent = 'Inventory Screen';
        addHTMLtoPage(Markup, this);

        this.rootEl = document.getElementById("inventory-section")!;
        this.inventoryGridEl = this.rootEl.querySelector(".inventory-grid")!;
        this.renderInventory();
    };
    show(){};
    hide(){};

    private renderInventory(){
        const inventory = this.player.inventory.getSlots()
        this.inventoryGridEl.innerHTML = "";

        // Go through each inventory slot - Switch on Null/Item
        inventory.forEach((item, index) =>{
            const slot = document.createElement("div");
            slot.classList.add(`item-slot`, item? `filled` : `empty`);
            slot.dataset.slotIndex = index.toString();
            slot.addEventListener("click", (e) => this.onInventoryClick(e)) 

            if(item){
                slot.classList.add(`rarity-${item.rarity}`);
                slot.setAttribute('draggable', 'true');

                slot.innerHTML = `<div class="item-icon"><img src="${item.iconUrl}" alt="${item.name}" /></div><div class="item-count">${item.quantity}</div>`;
            }
            this.inventoryGridEl.appendChild(slot);
        })
    }

    private onInventoryClick(e: MouseEvent){
        const slotEl = e.currentTarget as HTMLElement;
        const idxStr = slotEl.dataset.slotIndex;
        if(idxStr == null) return;

        const index = Number(idxStr);
        const item = Player.getInstance().inventory.getSlots()[index]

        if(item){
            console.log(`Clicked on slot ${index} with`, item);
        } else {
            console.log("Clicked empty slot", index)
        }
    }

}