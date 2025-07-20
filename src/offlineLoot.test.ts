import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Area, AreaSpec } from './models/Area';
import { Equipment } from './models/Equipment';
import { InventoryRegistry } from './features/inventory/InventoryRegistry';

const equipmentSpec = {
  id: 'test_item',
  category: 'equipment',
  name: 'Test Item',
  description: '',
  equipType: 'head',
  statMod: {},
  iconUrl: '',
  resistances: {},
  baseRenown: 0,
  tags: ['test']
} as any;

const areaZero: AreaSpec = {
  id: 'test_zero',
  displayName: 'Test Area Zero',
  tier: 1,
  requires: [],
  spawns: [{ monsterId: 'm1', weight: 1, drops: { tags: ['test'], baseDropChance: 0 } }],
  boss: { monsterId: 'm1', weight: 1, drops: { tags: ['test'], baseDropChance: 1 } }
};

const areaHalf: AreaSpec = {
  id: 'test_half',
  displayName: 'Test Area Half',
  tier: 1,
  requires: [],
  spawns: [{ monsterId: 'm1', weight: 1, drops: { tags: ['test'], baseDropChance: 1 } }],
  boss: { monsterId: 'm1', weight: 1, drops: { tags: ['test'], baseDropChance: 1 } }
};

beforeEach(() => {
  // Reset registries
  (Equipment as any).specById = new Map();
  Equipment.registerSpecs([equipmentSpec]);

  (Area as any).specById = new Map();
  Area.registerSpecs([areaZero, areaHalf]);

  (InventoryRegistry as any).specMap = new Map();
  InventoryRegistry.init();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Area.rollOfflineLoot', () => {
  it('returns no items when drop chance is 0', () => {
    const area = Area.create('test_zero');
    (area as any).selectedSpawn = area.spawns[0];
    const loot = area.rollOfflineLoot();
    expect(loot.length).toBe(0);
  });

  it('awards items based on offline drop chance', () => {
    const area = Area.create('test_half');
    (area as any).selectedSpawn = area.spawns[0];
    const rnd = vi.spyOn(Math, 'random');
    rnd.mockReturnValueOnce(0); // numItems -> 1
    rnd.mockReturnValueOnce(0); // randomIndex
    rnd.mockReturnValueOnce(0.3); // drop chance < 0.5 -> success
    const loot = area.rollOfflineLoot();
    expect(loot).toEqual(['test_item']);
  });
});
