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
		children: [{ name: "guildHall" }, { name: "mine" }, { name: "library" }, { name: "blacksmith" }, { name: "market" }],
	},
	{ name: "character" },
	{ name: "inventory" },
];

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
	| "guildHall";
