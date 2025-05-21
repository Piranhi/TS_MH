export const MILESTONES = {
	HUNT_BOSS_T1: "hunt.boss.tier1",
	HUNT_BOSS_T2: "hunt.boss.tier2",
} as const;

export type MilestoneTag = (typeof MILESTONES)[keyof typeof MILESTONES];

export interface MilestoneEventPayload {
	tag: MilestoneTag; // the milestone identifier
	timestamp: number; // when it happened (ms since epoch)
	[key: string]: any; // allow any extra fields
}
