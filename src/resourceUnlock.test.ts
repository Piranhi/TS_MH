import { describe, it, expect, beforeEach } from 'vitest';
import { Resource } from './features/inventory/Resource';
import { ResourceManager } from './features/inventory/ResourceManager';
import resources from './data/resources.json';
import type { ResourceSpec } from './shared/types';

beforeEach(() => {
  // Reset specs map between tests
  (Resource as any).specById = new Map<string, ResourceSpec>();
  Resource.registerSpecs(resources as ResourceSpec[]);
});

describe('Resource unlocks', () => {
  it('unlocks new resources at specified levels and persists', () => {
    const manager = new ResourceManager();

    // Initially only starting resources should be unlocked
    expect(manager.hasResource('charstone')).toBe(false);

    // Grant enough XP to reach level 25 for iron_ingot
    manager.addResourceXP('iron_ingot', 4000);

    expect(manager.hasResource('charstone')).toBe(true);
    expect(manager.getResourceData('charstone')?.isUnlocked).toBe(true);

    const saved = manager.save();

    const manager2 = new ResourceManager();
    manager2.load(saved);

    expect(manager2.hasResource('charstone')).toBe(true);
    expect(manager2.getResourceData('charstone')?.isUnlocked).toBe(true);
  });
});
