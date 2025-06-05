export const MILESTONES = {
    HUNT_BOSS_T1: "hunt.boss.tier1",
    HUNT_BOSS_T2: "hunt.boss.tier2",
    HUNT_BOSS_T3: "hunt.boss.tier3",
    HUNT_BOSS_T4: "hunt.boss.tier4",
    HUNT_BOSS_T5: "hunt.boss.tier5",
    HUNT_BOSS_T6: "hunt.boss.tier6",
    HUNT_BOSS_T7: "hunt.boss.tier7",
    HUNT_BOSS_T8: "hunt.boss.tier8",
    HUNT_BOSS_T9: "hunt.boss.tier9",
    HUNT_BOSS_T10: "hunt.boss.tier10",
    HUNT_BOSS_T11: "hunt.boss.tier11",
    HUNT_BOSS_T12: "hunt.boss.tier12",
} as const;
export type ProgressionEvent = "monster-killed" | "building-built";

export type MilestoneTag = (typeof MILESTONES)[keyof typeof MILESTONES];

export interface MilestoneEventPayload {
    tag: MilestoneTag; // the milestone identifier
    timestamp: number; // when it happened (ms since epoch)
    [key: string]: any; // allow any extra fields
}

export type MilestoneMeta = Omit<Partial<MilestoneEventPayload>, "tag" | "timestamp">;
