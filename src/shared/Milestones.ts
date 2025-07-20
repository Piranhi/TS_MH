// src/shared/Milestones.ts

export type ProgressionEvent = "monster-killed" | "building-built";
export type MilestoneTag = string; // Any milestone ID from milestones.json

export interface MilestoneEventPayload {
	tag: MilestoneTag; // the milestone identifier
	timestamp: number; // when it happened (ms since epoch)
	[key: string]: any; // allow any extra fields
}

export type MilestoneMeta = Omit<Partial<MilestoneEventPayload>, "tag" | "timestamp">;
