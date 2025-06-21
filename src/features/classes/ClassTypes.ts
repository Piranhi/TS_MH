// Class system type definitions
export interface NodeEffect {
	kind: "statModifier" | "unlockAbility" | "abilityModifier";
	stat?: string; // for statModifier and abilityModifier
	amount?: number; // for statModifier and abilityModifier
	abilityId?: string; // for unlockAbility and abilityModifier
}

export interface ClassNodeSpec {
	id: string;
	name: string;
	description: string;
	iconUrl: string;
	cost: number;
	maxPoints: number;
	row: number; // Grid position
	col: number; // Grid position
	prereq?: string; // ID of prerequisite node
	effects: NodeEffect[];
}

export interface ClassSpec {
	id: string;
	name: string;
	description: string;
	iconUrl: string;
	nodes: ClassNodeSpec[];
}

export interface ClassSystemState {
	unlockedClasses: string[];
	nodePoints: Record<string, Record<string, number>>;
	availablePoints: number;
}

// Example class specs for testing
/* export const WARRIOR_CLASS_SPEC: ClassSpec = {
	id: "warrior",
	name: "Warrior",
	description: "Master of physical combat",
	nodes: [
		{
			id: "basic_attack",
			name: "Basic Training",
			cost: 1,
			maxPoints: 5,
			row: 0,
			col: 1,
			effects: [
				{
					kind: "statModifier",
					stat: "attack",
					amount: 2,
				},
			],
		},
		{
			id: "armor_training",
			name: "Armor Training",
			cost: 1,
			maxPoints: 3,
			row: 1,
			col: 0,
			prereq: "basic_attack",
			effects: [
				{
					kind: "statModifier",
					stat: "defence",
					amount: 3,
				},
			],
		},
		{
			id: "weapon_mastery",
			name: "Weapon Mastery",
			cost: 2,
			maxPoints: 3,
			row: 1,
			col: 2,
			prereq: "basic_attack",
			effects: [
				{
					kind: "statModifier",
					stat: "attack",
					amount: 5,
				},
			],
		},
		{
			id: "berserker",
			name: "Berserker Rage",
			cost: 3,
			maxPoints: 1,
			row: 2,
			col: 1,
			prereq: "weapon_mastery",
			effects: [
				{
					kind: "unlockAbility",
					abilityId: "berserker_rage",
				},
			],
		},
	],
};

export const MAGE_CLASS_SPEC: ClassSpec = {
	id: "mage",
	name: "Mage",
	description: "Wielder of arcane forces",
	nodes: [
		{
			id: "arcane_power",
			name: "Arcane Power",
			cost: 1,
			maxPoints: 5,
			row: 0,
			col: 1,
			effects: [
				{
					kind: "statModifier",
					stat: "attack",
					amount: 1,
				},
			],
		},
		{
			id: "mana_shield",
			name: "Mana Shield",
			cost: 2,
			maxPoints: 3,
			row: 1,
			col: 0,
			prereq: "arcane_power",
			effects: [
				{
					kind: "statModifier",
					stat: "defence",
					amount: 2,
				},
			],
		},
		{
			id: "spell_power",
			name: "Spell Power",
			cost: 2,
			maxPoints: 3,
			row: 1,
			col: 2,
			prereq: "arcane_power",
			effects: [
				{
					kind: "statModifier",
					stat: "attack",
					amount: 3,
				},
			],
		},
	],
}; */
