// Outpost.ts - Correct architecture
import { SpecRegistryBase } from "@/models/SpecRegistryBase";
import { Saveable } from "@/shared/storage-types";
import { bus } from "@/core/EventBus";
import { OutpostSpec } from "@/shared/types";

export interface OutpostState {
    level: number;
    experience: number;
    lastResourceCollection: number;
    isActive: boolean;
}

export class Outpost extends SpecRegistryBase<OutpostSpec> implements Saveable {
    private constructor(private readonly spec: OutpostSpec, private state: OutpostState) {
        super();
        this.setupResourceGeneration();
    }

    // ✅ Event handling without Destroyable inheritance
    private eventCleanup: (() => void)[] = [];

    private setupResourceGeneration() {
        // Manual event binding with cleanup tracking
        const unsubscribe = bus.on("Game:GameTick", (dt) => {
            this.generateResources(dt);
        });

        this.eventCleanup.push(unsubscribe);
    }

    // ✅ Manual cleanup method (called by AreaManager if needed)
    public cleanup() {
        this.eventCleanup.forEach((unsub) => unsub());
        this.eventCleanup = [];
    }

    // === LEVELING SYSTEM ===
    public levelUp(): boolean {
        if (this.state.level >= this.spec.maxLevel) return false;

        this.state.level++;

        bus.emit("outpost:levelUp", {
            outpostId: this.spec.id,
            newLevel: this.state.level,
        });

        return true;
    }

    // === RESOURCE GENERATION ===
    private generateResources(deltaTime: number) {
        if (!this.state.isActive) return;

        const resourcesPerSecond = this.getResourceRate();
        const generated = resourcesPerSecond * deltaTime;

        this.spec.resourceTypes.forEach((resourceType) => {
            bus.emit("resource:generated", {
                type: resourceType,
                amount: generated,
                source: `outpost_${this.spec.id}`,
            });
        });
    }

    // === AREA PROGRESSION MODIFIERS ===
    public getAreaModifiers() {
        const level = this.state.level;

        return {
            killsToUnlockBoss: Math.max(1, 10 - level),
            enemySpawnSpeedMultiplier: 1 + level * 0.1,
            canSkipArea: level >= 10,
            dropRateMultiplier: 1 + level * 0.05,
            experienceMultiplier: 1 + level * 0.02,
        };
    }

    // === HELPER METHODS ===
    private getResourceRate(): number {
        return this.spec.baseResourceRate * (1 + this.state.level * 0.2);
    }

    // === GETTERS ===
    get id() {
        return this.spec.id;
    }
    get areaId() {
        return this.spec.areaId;
    }
    get level() {
        return this.state.level;
    }
    get displayName() {
        return this.spec.displayName;
    }

    // === SAVE/LOAD ===
    save(): OutpostState {
        return { ...this.state };
    }

    load(state: OutpostState): void {
        this.state = { ...state };
    }

    toJSON() {
        return {
            __type: "Outpost",
            spec: this.spec.id,
            state: this.state,
        };
    }

    static fromJSON(raw: any): Outpost {
        const spec = this.specById.get(raw.spec);
        if (!spec) throw new Error(`Unknown outpost "${raw.spec}"`);
        return new Outpost(spec, raw.state);
    }

    // ✅ SpecRegistryBase pattern
    public static override specById = new Map<string, OutpostSpec>();

    static getSpecByAreaId(areaId: string): OutpostSpec | undefined {
        return Array.from(this.specById.values()).find((spec) => spec.areaId === areaId);
    }

    static create(spec: OutpostSpec): Outpost {
        const defaultState: OutpostState = {
            level: 1,
            experience: 0,
            lastResourceCollection: Date.now(),
            isActive: true,
        };
        return new Outpost(spec, defaultState);
    }
}
