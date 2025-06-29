import { ElementType } from "@/shared/types";

// Simple data structure for all status effects
export interface StatusDefinition {
	id: string;
	name: string;
	duration: number;

	// What this status modifies (can have multiple)
	modifiers?: {
		attackPercent?: number; // 0.3 = +30%
		defensePercent?: number;
		speedPercent?: number; // -0.3 = -30%

		// Resistance changes
		resistances?: {
			physical?: number;
			fire?: number;
			ice?: number;
			lightning?: number;
			poison?: number;
		};
	};

	// For DoT/HoT effects
	periodic?: {
		damagePerSecond?: number;
		healPerSecond?: number;
		element?: ElementType;
		scaleWithAttack?: number; // 0.1 = add 10% of attack
	};
}

// All status effects in one place
export const STATUSES: Record<string, StatusDefinition> = {
	// Speed modifiers
	slow: {
		id: "slow",
		name: "Slowed",
		duration: 5,
		modifiers: {
			speedPercent: -0.3,
		},
	},

	frozen: {
		id: "frozen",
		name: "Frozen",
		duration: 2,
		modifiers: {
			speedPercent: -1.0, // -100% = can't act
		},
	},

	// Stat modifiers
	strengthen: {
		id: "strengthen",
		name: "Strengthened",
		duration: 10,
		modifiers: {
			attackPercent: 0.3,
		},
	},

	weaken: {
		id: "weaken",
		name: "Weakened",
		duration: 8,
		modifiers: {
			attackPercent: -0.2,
		},
	},

	// Resistance modifiers
	chilled: {
		id: "chilled",
		name: "Chilled",
		duration: 5,
		modifiers: {
			resistances: {
				ice: -30, // Take 30% more ice damage
			},
		},
	},

	// DoT effects
	burn: {
		id: "burn",
		name: "Burning",
		duration: 3,
		periodic: {
			damagePerSecond: 5,
			element: "fire",
			scaleWithAttack: 0.1,
		},
	},

	poison: {
		id: "poison",
		name: "Poisoned",
		duration: 6,
		periodic: {
			damagePerSecond: 3,
			element: "poison",
			scaleWithAttack: 0.15,
		},
	},

	// HoT effects
	regeneration: {
		id: "regeneration",
		name: "Regenerating",
		duration: 5,
		periodic: {
			healPerSecond: 10,
			scaleWithAttack: 0.05,
		},
	},
};
