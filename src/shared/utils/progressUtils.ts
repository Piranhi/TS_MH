import { MilestoneManager } from "@/models/MilestoneManager";

export function isFeatureUnlocked(featureId: string) {
	return MilestoneManager.instance.has(featureId);
}
