import { Equipment } from "@/models/Equipment";
import { TrainedStat } from "@/models/TrainedStat";
import { BoundedNumber } from "@/models/value-objects/Bounded";
import { RegenPool } from "@/models/value-objects/RegenPool";
import { Building } from "@/features/settlement/Building";

/* export function reviveGame(_key: string, value: any) {
	if (value && value._type == "Equipment") return Equipment.fromJSON(value);
	if (value && value._type == "ClassCard") return Equipment.fromJSON(value);
}
 */

export function reviveGame(_key: string, value: any): any {
	// If it’s an object with our marker, dispatch to the right fromJSON
	if (value && typeof value === "object" && "__type" in value) {
		switch ((value as any).__type) {
			case "Equipment":
				return Equipment.fromJSON(value);
			case "TrainedStat":
				return TrainedStat.fromJSON(value);
			case "BoundedNumber":
				return BoundedNumber.fromJSON(value);
			case "RegenPool":
				return RegenPool.fromJSON(value);
			case "Building":
				return Building.fromJSON(value);

			// …add cases for any other types…
		}
	}
	// IMPORTANT! Leave everything else untouched
	return value;
}
