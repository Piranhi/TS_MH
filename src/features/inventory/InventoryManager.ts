import { bus } from "@/EventBus";
import { player } from "@/player";
import type { InventoryItem, ItemCategory } from "@/shared/types";
export class InventoryManager {
	private maxSlots: number = 20;
	private slots: (InventoryItem | null)[];

	constructor() {
		this.slots = Array(this.maxSlots).fill(null);
	}

	public getSlots() {
		return this.slots;
	}

	public moveToSlot(item: InventoryItem, targetIndex: number) {
		// Remove from old slot
		const oldIndex = this.slots.findIndex((i) => i === item);
		if (oldIndex !== -1) this.slots[oldIndex] = null;

		this.slots[targetIndex] = item;
		bus.emit("inventory:inventoryChanged");
	}

	public expandInventorySize(by: number) {
		this.slots.push(...Array(by).fill(null));
	}

	public addItem(item: InventoryItem): boolean {
		const idx = this.slots.findIndex((slot) => slot === null);
		if (idx === -1) {
			return false;
		} // No free slots
		this.slots[idx] = item;
		bus.emit("inventory:inventoryChanged");
		return true;
	}



	public removeItem(item: InventoryItem):boolean{
        const idx = this.slots.findIndex(slot => slot === item)
            if(idx === -1){
                return false //Item not founc
            }
            this.slots[idx] = null;;
		bus.emit("inventory:inventoryChanged");
        return true;
	}

    public removeAt(index: number): void{
        if (index >= 0 && index < this.slots.length){
            this.slots[index] = null
            bus.emit("inventory:inventoryChanged");
        }
    }

	public getByCatergory(cat: ItemCategory) {
		return this.slots.filter((i) => i !== null && i.category === cat);
	}
}
