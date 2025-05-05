export interface MonsterSpec {
    id: string;
    displayName: string;
    rarity: "common" | "uncommon" | "rare";
    baseStats: { hp: number; attack: number; defense: number; speed: number };
    attacks: string[];
  }
  
  export class Monster {
    constructor(private readonly spec: MonsterSpec) {}
  
    /* --- simple getters --- */
    get id()          { return this.spec.id; }
    get displayName() { return this.spec.displayName; }
    get rarity()      { return this.spec.rarity; }
    get baseStats()   { return this.spec.baseStats; }
  
    /* you can add more behaviour later */
  }