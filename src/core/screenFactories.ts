// Import game screens
import {SettlementScreen} from "../ui/Screens/SettlementScreen";
import {HuntScreen} from "../ui/Screens/HuntScreen";
import { BlacksmithScreen } from "../ui/Screens/BlacksmithScreen";
import { CharacterScreen } from "../ui/Screens/CharacterScreen";
import { InventoryScreen } from "../ui/Screens/InventoryScreen";
import { ResearchScreen } from "../ui/Screens/ResearchScreen";
import { TrainScreen } from "../ui/Screens/TrainScreen";
import { ScreenName } from "../shared/types";
import { GameScreen } from "../ui/Screens/gameScreen";

// Screen Factory
export const screenFactories: Record< ScreenName, () => GameScreen> = {
  settlement:   () => new SettlementScreen(),
  train:        () => new TrainScreen(),
  hunt:         () => new HuntScreen(),
  blacksmith:   () => new BlacksmithScreen(),
  character:    () => new CharacterScreen(),
  inventory:    () => new InventoryScreen(),
  research:     () => new ResearchScreen(),
}