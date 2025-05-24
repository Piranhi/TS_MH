import { EnemyCharacter } from "../../models/EnemyCharacter";
import { PlayerCharacter } from "../../models/PlayerCharacter";
import { bus } from "../../core/EventBus";
import { Area } from "@/models/Area";
import { Player } from "@/core/Player";
import { EffectProcessor } from "./EffectProcessor";
import { Destroyable } from "@/models/Destroyable";
import { GameContext } from "@/core/GameContext";

export class CombatManager extends Destroyable {
	private context = GameContext.getInstance();

	private effectProcessor: EffectProcessor;
	public isFinished: boolean = false;
	public playerWon: boolean = false;
	private elapsed: number = 0;
	private combatEndOverride = false;

	constructor(private readonly playerCharacter: PlayerCharacter, private readonly enemyCharacter: EnemyCharacter, private readonly area: Area) {
		super();
		this.effectProcessor = new EffectProcessor();
		playerCharacter.beginCombat(this);
		enemyCharacter.beginCombat(this);
		bus.emit("combat:started", { player: this.playerCharacter, enemy: this.enemyCharacter });
	}

	public onTick(dt: number) {
		if (this.combatEndOverride) return;
		this.elapsed += dt;
		// Tick players whilst combat is active
		// Player effects first
		const playerEffects = this.playerCharacter.getReadyEffects(dt);
		for (const effect of playerEffects) this.effectProcessor.apply(effect, this.enemyCharacter);
		if (this.playerCharacter.isAlive() === false || this.enemyCharacter.isAlive() === false) {
			this.endCombat();
		}
		const enemyEffects = this.enemyCharacter.getReadyEffects(dt);
		for (const effect of playerEffects) this.effectProcessor.apply(effect, this.playerCharacter);
		if (this.playerCharacter.isAlive() === false || this.enemyCharacter.isAlive() === false) {
			this.endCombat();
		}
	}

	public endCombatEarly() {
		//Prevent ticking, end combat
		this.combatEndOverride = true;
		this.playerCharacter.endCombat();
		this.enemyCharacter.endCombat();
		bus.emit("combat:ended", "Changing Areas");
		this.enemyCharacter.destroy();
	}

	private endCombat() {
		this.playerCharacter.endCombat();
		this.enemyCharacter.endCombat();
		this.isFinished = true;
		this.playerWon = this.playerCharacter.isAlive();
		if (this.playerWon) {
			bus.emit("hunt:areaKill", { enemyId: this.enemyCharacter.spec.id, areaId: this.area.id });
			this.rewardPlayer();
		}
		bus.emit("combat:ended", this.playerWon ? "Player Won" : "Player fled");
		this.enemyCharacter.destroy();
	}

	private rewardPlayer() {
		Player.getInstance().adjustRenown(this.area.getScaledValue(this.enemyCharacter.spec.renownMulti, "renown"));
		const lootArray = this.area.rollLoot();
		if (!lootArray || lootArray.length === 0) return;
		lootArray.forEach((loot) => {
			this.context.inventory.addLootById(loot, 1);
		});
		bus.emit("inventory:dropped", lootArray);
	}
}
