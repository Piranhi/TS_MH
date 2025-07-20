import { MilestoneTag } from "./Milestones";

export type ScreenNav = {
	name: ScreenName;
	children?: ScreenNav[];
};

export const screenNav: ScreenNav[] = [
	{ name: "train" },
	{
		name: "hunt",
		children: [{ name: "outposts" }],
	},
	{
		name: "settlement",
		children: [
			{ name: "guildHall" },
			{ name: "housing" },
			{ name: "mine" },
			{ name: "library" },
			{ name: "blacksmith" },
			{ name: "market" },
		],
	},
	{ name: "character" },
	{ name: "inventory" },
	{ name: "bestiary" },
];

// Add progression unlock requirements to some screens
export const progressionUnlockRequirements: Map<ScreenName, MilestoneTag[]> = new Map([
	["settlement", ["screen.settlement"]],
	["outposts", ["screen.outposts"]],
	["bestiary", ["screen.beasiary"]],
	["character", ["screen.character"]],
	["blacksmith", ["building.blacksmith"]],
	["library", ["building.library"]],
	["market", ["building.market"]],
	["mine", ["building.mine"]],
	["guildHall", ["building.guildHall"]],
	["housing", ["building.housing"]],
	["bestiary", ["hunt.boss.tier1"]],
]);

export type ScreenName =
	| "train"
	| "settlement"
	| "character"
	| "hunt"
	| "outposts"
	| "inventory"
	| "research"
	| "blacksmith"
	| "library"
	| "market"
	| "mine"
	| "guildHall"
	| "housing"
	| "bestiary";
