import { BaseCharacter, CharacterSnapshot } from "./BaseCharacter";
import { StatsEngine } from "@/core/StatsEngine";
import { bus } from "@/core/EventBus";
import { PrestigeState } from "@/shared/stats-types";
import { bindEvent } from "@/shared/utils/busUtils";
import { BigNumber } from "./utils/BigNumber";
import { Saveable } from "@/shared/storage-types";
import { BalanceCalculators, GAME_BALANCE } from "@/balance/GameBalance";

interface playerCharSaveState {
    charLevel: number;
}

export class PlayerCharacter extends BaseCharacter implements Saveable {
    readonly statsEngine: StatsEngine;

    private passiveHealTick = 0;
    private classCardAbilityIds: string[] = [];

    private _currentXp: BigNumber = new BigNumber(0);
    private _nextXpThreshold: BigNumber = new BigNumber(10);

    constructor(prestigeStats: PrestigeState) {
        const engine = new StatsEngine();
        super("You", { get: (k) => engine.get(k) });
        bindEvent(this.eventBindings, "player:statsChanged", () => this.updateStats());
        this.statsEngine = engine;

        /* pre‑register empty layers */
        this.calcLevelBonuses(); // Add stat bonuses for level
        this.statsEngine.setLayer("prestige", () => ({
            attack: prestigeStats.permanentAttack,
            defence: prestigeStats.permanentDefence,
            hp: prestigeStats.permanentHP,
        }));
        this.statsEngine.setLayer("equipment", () => ({}));
        this.statsEngine.setLayer("trainedStats", () => ({}));
        this.statsEngine.setLayer("classCard", () => ({}));
        this.statsEngine.setLayer("buffs", () => ({}));

        bindEvent(this.eventBindings, "Game:GameTick", () => this.passiveHeal());
        //bindEvent(this.eventBindings, "hunt:XPearned", (amt) => this.gainXp(amt));
    }

    public init() {
        //this.defaultAbilityIds.push("basic_heal");
        this.recalculateAbilities();
        bus.emit("player:statsChanged");
    }

    private passiveHeal() {
        this.passiveHealTick++;

        this.hp.increase(new BigNumber(GAME_BALANCE.player.healing.passiveHealAmount));
    }

    healInRecovery() {
        this.hp.increase(this.maxHp.multiply(GAME_BALANCE.player.healing.recoveryStateHeal)); // Always heal at least 1
    }

    private updateStats() {
        this.hp.max = new BigNumber(this.stats.get("hp"));
    }

    public gainXp(amt: BigNumber) {
        // BigNumber.add() returns a new instance, so we need to assign it back
        this._currentXp = this._currentXp.add(amt);
        let levelledUp = false;

        // Use BigNumber comparison methods instead of >= operator
        while (this._currentXp.gte(this._nextXpThreshold)) {
            this.levelUp();
            levelledUp = true;

            // Subtract and assign back
            this._currentXp = this._currentXp.subtract(this._nextXpThreshold);

            // For threshold calculation, convert to number, calculate, then back to BigNumber
            const currentThreshold = this._nextXpThreshold.toNumber();
            const newThreshold = Math.floor(currentThreshold * GAME_BALANCE.player.xpThresholdMultiplier);
            this._nextXpThreshold = new BigNumber(newThreshold);
        }

        if (levelledUp) {
            this.calcLevelBonuses();
            bus.emit("char:levelUp", this._charLevel);
        }
        bus.emit("char:gainedXp", amt);
    }

    public levelUp() {
        this._charLevel++;
    }

    private calcLevelBonuses() {
        // Use centralized calculator
        const bonuses = BalanceCalculators.getAllPlayerLevelBonuses(this._charLevel);
        this.statsEngine.setLayer("level", () => bonuses);
    }

    public setClassCardAbilities(abilityIds: string[]) {
        this.classCardAbilityIds = abilityIds;
        this.recalculateAbilities();
    }
    /** Recalculate full ability set and update map */
    private recalculateAbilities() {
        // Merge all sources (dedupe with Set)
        const mergedIds = Array.from(
            new Set([
                ...(this.defaultAbilityIds ?? []),
                ...this.classCardAbilityIds,
                // ...add more here if needed
            ]),
        );
        this.updateAbilities(mergedIds);
    }

    get level(): number {
        return this._charLevel;
    }

    get currentXp(): BigNumber {
        return this._currentXp;
    }

    get nextXpThreshold(): BigNumber {
        return this._nextXpThreshold;
    }

    override getAvatarUrl(): string {
        return "/images/player/player-avatar-01.png";
    }

    override snapshot(): CharacterSnapshot {
        return {
            name: this.name,
            realHP: { current: this.currentHp.toString(), max: this.maxHp.toString(), percent: this.hp.percent.toString() },
            attack: this.attack.toString(),
            defence: this.defence.toString(),
            abilities: this.getActiveAbilities(),
            imgUrl: this.getAvatarUrl(),
            rarity: "Todo",
            level: { lvl: this._charLevel, current: this._currentXp, next: this._nextXpThreshold },
        };
    }

    save(): playerCharSaveState {
        return {
            charLevel: this._charLevel,
        };
    }

    load(state: playerCharSaveState): void {
        this._charLevel = state.charLevel;
    }
}
