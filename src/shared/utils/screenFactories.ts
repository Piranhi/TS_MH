// Import game screens
import {SettlementScreen} from "../../Screens/SettlementScreen";
import {HuntScreen} from "../../Screens/HuntScreen";
import { BlacksmithScreen } from "../../Screens/BlacksmithScreen";
import { CharacterScreen } from "../../Screens/CharacterScreen";
import { InventoryScreen } from "../../Screens/InventoryScreen";
import { ResearchScreen } from "../../Screens/ResearchScreen";
import { TrainScreen } from "../../Screens/TrainScreen";
import { ScreenName } from "../types";
import { GameScreen } from "../../Screens/gameScreen";

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