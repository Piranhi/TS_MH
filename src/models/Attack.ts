export interface AttackSpec {
    id: string;
    displayName: string;
    type: "physical" | "magical";
    power: number;
    cooldown: number;
  }
  
  export class Attack {
    constructor(private readonly spec: AttackSpec) {}
  
    get id()   { return this.spec.id; }
    get name() { return this.spec.displayName; }
  }