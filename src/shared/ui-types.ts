export type ScreenNav = {
	name: ScreenName;
	children?: ScreenNav[];
};

export const screenNav: ScreenNav[] = [
	{
		name: "settlement",
		children: [{ name: "library" }, { name: "blacksmith" }, { name: "market" }],
	},

	{
		name: "hunt",
		children: [{ name: "outposts" }],
	},
	{ name: "train" },
	{ name: "character" },
	{ name: "inventory" },
];

export type ScreenName = "settlement" | "character" | "hunt" | "outposts" | "inventory" | "research" | "train" | "blacksmith" | "library" | "market";
