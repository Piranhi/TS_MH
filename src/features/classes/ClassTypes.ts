import { Stats } from "@/models/Stats";

export type NodeEffect =
  | { kind: "statModifier"; stat: keyof Stats; amount: number }
  | { kind: "unlockAbility"; abilityId: string };

export interface ClassNodeSpec {
  id: string;
  name: string;
  row: number;
  col: number;
  cost: number;
  maxPoints: number;
  prereq?: string;
  effects: NodeEffect[];
}

export interface ClassSpec {
  id: string;
  name: string;
  nodes: ClassNodeSpec[];
}

export interface ClassSystemState {
  unlockedClasses: string[];
  nodePoints: Record<string, Record<string, number>>;
  availablePoints: number;
}
