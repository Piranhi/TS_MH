import { ResearchSpec, ResearchState } from "@/shared/types";
import { SpecRegistryBase } from "@/models/SpecRegistryBase";

export class ResearchUpgrade extends SpecRegistryBase<ResearchSpec> {
    private constructor(private readonly spec: ResearchSpec, private state: ResearchState) {
        super();
    }

    tick(dt: number, speed: number) {
        if (this.state.unlocked) return;
        this.state.progress += dt * speed;
        if (this.state.progress >= this.spec.baseTime) {
            this.state.unlocked = true;
        }
    }

    get id() {
        return this.spec.id;
    }
    get name() {
        return this.spec.name;
    }
    get description() {
        return this.spec.description;
    }
    get icon() {
        return this.spec.icon;
    }
    get progress() {
        return this.state.progress;
    }
    get requiredTime() {
        return this.spec.baseTime;
    }
    get unlocked() {
        return this.state.unlocked;
    }

    toJSON() {
        return { __type: "ResearchUpgrade", spec: this.spec.id, state: this.state };
    }

    static fromJSON(raw: any) {
        const spec = this.specById.get(raw.spec);
        if (!spec) throw new Error(`Unknown research ${raw.spec}`);
        return new ResearchUpgrade(spec, raw.state);
    }

    public static override specById = new Map<string, ResearchSpec>();

    static create(id: string): ResearchUpgrade {
        const spec = this.specById.get(id);
        if (!spec) throw new Error(`Unknown research ${id}`);
        const defaultState: ResearchState = { progress: 0, unlocked: false };
        return new ResearchUpgrade(spec, defaultState);
    }
}
