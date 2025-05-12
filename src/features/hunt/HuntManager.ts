// HuntManager.ts
// The finite‑state controller that drives the core idle loop (Search → Combat → Recovery).
// You will iterate on this; for now it is deliberately minimal but functional.
import { bus } from "@/core/EventBus";
import { PlayerCharacter } from "../../models//PlayerCharacter";
import { CombatManager } from "./CombatManager";
import { EnemyCharacter } from "../../models//EnemyCharacter";
import { Area } from "@/models/Area";

export enum HuntState {
    Idle = "Idle",
    Search = "Search",
    Combat = "Combat",
    Recovery = "Recovery",
}

/**
 * Minimal interface every concrete state must implement.
 * `tick` is called every game‑loop iteration; `dt` is milliseconds elapsed since the previous call.
 */
interface StateHandler {
    onEnter(): void;
    onExit(): void;
    onTick(dt: number): void;
}

export class HuntManager {
    private state: HuntState = HuntState.Idle; // current enum value – useful for save files
    private handler: StateHandler;
    private area!: Area;

    constructor(private readonly playerCharacter: PlayerCharacter) {
        this.handler = this.makeIdleState();
        this.transition(HuntState.Idle, this.makeIdleState());

        bus.on("Game:GameTick", (dt) => this.onTick(dt));
        bus.on("hunt:areaSelected", (areaId) => this.setArea(areaId));
    }

    /** Change the hunting grounds without restarting the whole loop. */
    public setArea(areaId: string) {
        this.area = Area.create(areaId);
        this.transition(HuntState.Search, this.makeSearchState());
    }

    public onTick(dt: number) {
        this.handler.onTick(dt);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  STATE FACTORIES – each returns a fresh object that closes over any
    //  state‑specific variables it needs (e.g., the current enemy instance).
    // ────────────────────────────────────────────────────────────────────────────

    // IDLE STATE
    private makeIdleState(): StateHandler {
        return {
            onEnter: () => {
                bus.emit("hunt:stateChanged", HuntState.Idle);
            },
            onTick: (dt: number) => {},
            onExit: () => {},
        };
    }

    // SEARCH STATE
    private makeSearchState(): StateHandler {
        // Local closure variable keeps track of an accumulated timer so that we roll
        // once per second independent of frame rate.
        let elapsed = 0;

        return {
            onEnter: () => {},
            onTick: (dt: number) => {
                elapsed += dt;
                if (elapsed >= 1) {
                    elapsed -= 1;
                    if (this.rollEncounter()) {
                        // Create Enemy from monster picker
                        const enemy = new EnemyCharacter(this.area.pickMonster());
                        this.startCombat(enemy);
                    }
                }
            },
            onExit: () => {},
        };
    }

    // COMBAT STATE
    private makeCombatState(enemy: EnemyCharacter): StateHandler {
        // fresh CombatManager per fight keeps combat math isolated and stateless
        const combatManager = new CombatManager(this.playerCharacter, enemy, this.area);

        return {
            onEnter: () => {},
            onTick: (dt: number) => {
                combatManager.onTick(dt);
                if (combatManager.isFinished) {
                    combatManager.playerWon ? this.transition(HuntState.Search, this.makeSearchState()) : this.transition(HuntState.Recovery, this.makeRecoveryState());
                }
            },
            onExit: () => {},
        };
    }

    // RECOVERY STATE
    private makeRecoveryState(): StateHandler {
        const HEAL_RATE = 0.05;

        return {
            onEnter: () => {},
            onTick: (dt: number) => {
                this.playerCharacter.heal((HEAL_RATE * dt) / 60);
                if (this.playerCharacter.currentHp === this.playerCharacter.maxHp) {
                    this.transition(HuntState.Search, this.makeSearchState());
                }
            },
            onExit: () => {},
        };
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ────────────────────────────────────────────────────────────────────────────

    private transition(newState: HuntState, newHandler: StateHandler) {
        this.handler.onExit();
        this.state = newState;
        this.handler = newHandler;
        this.handler.onEnter();
        bus.emit("hunt:stateChanged", this.state);
    }

    private startCombat(enemy: EnemyCharacter) {
        this.transition(HuntState.Combat, this.makeCombatState(enemy));
    }

    private rollEncounter(): boolean {
        const BASE_CHANCE = 0.5;
        console.log("Rolling");
        return Math.random() < BASE_CHANCE;
    }
}
