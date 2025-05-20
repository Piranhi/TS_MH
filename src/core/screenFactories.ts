// Import game screens
import { SettlementScreen } from "../ui/Screens/SettlementScreen";
import { HuntScreen } from "../ui/Screens/HuntScreen";
import { BlacksmithScreen } from "../ui/Screens/BlacksmithScreen";
import { CharacterScreen } from "../ui/Screens/CharacterScreen";
import { InventoryScreen } from "../ui/Screens/InventoryScreen";
import { ResearchScreen } from "../ui/Screens/ResearchScreen";
import { TrainScreen } from "../ui/Screens/TrainScreen";
import { GameScreen } from "../ui/Screens/gameScreen";
import { ScreenName } from "@/shared/ui-types";
import { OutpostsScreen } from "@/ui/Screens/OutpostsScreen";
import { LibraryScreen } from "@/ui/Screens/LibraryScreen";
import { MarketScreen } from "@/ui/Screens/MarketScreen";
import { MineScreen } from "@/ui/Screens/MineScreen";
import { GuildHallScreen } from "@/ui/Screens/GuildHallScreen";

// Screen Factory
export const screenFactories: Record<ScreenName, () => GameScreen> = {
	settlement: () => new SettlementScreen(),
	blacksmith: () => new BlacksmithScreen(),
	library: () => new LibraryScreen(),
	market: () => new MarketScreen(),
	train: () => new TrainScreen(),
	hunt: () => new HuntScreen(),
	outposts: () => new OutpostsScreen(),
	character: () => new CharacterScreen(),
	inventory: () => new InventoryScreen(),
	research: () => new ResearchScreen(),
	mine: () => new MineScreen(),
	guildHall: () => new GuildHallScreen(),
};
