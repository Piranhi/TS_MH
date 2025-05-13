import { Equipment } from "@/models/Equipment";
import { ClassCard } from "@/features/classcards/ClassCard";
import { Player } from "@/models/player";
import { PlayerCharacter } from "@/models/PlayerCharacter";
import { TrainedStat } from "@/models/TrainedStat";
import { Bounded } from "@/models/value-objects/Bounded";
import { RegenPool } from "@/models/value-objects/RegenPool";

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
			case "ClassCard":
				return ClassCard.fromJSON(value);
			case "TrainedStat":
				return TrainedStat.fromJSON(value);
			case "Bounded":
				return Bounded.fromJSON(value);
			case "RegenPool":
				return RegenPool.fromJSON(value);

			// …add cases for any other types…
		}
	}
	// IMPORTANT! Leave everything else untouched
	return value;
}
