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
	["settlement", ["feature.settlement"]],
	["outposts", ["feature.outposts"]],
	["bestiary", ["feature.bestiary"]],
	["character", ["feature.character"]],
	["blacksmith", ["feature.blacksmith"]],
	["library", ["feature.library"]],
	["market", ["feature.market"]],
	["mine", ["feature.mine"]],
	["guildHall", ["feature.guildHall"]],
	["housing", ["feature.housing"]],
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
