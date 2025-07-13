import { describe, it, expect } from 'vitest';
import { RecruitService } from './features/settlement/RecruitService';
import traits from './data/traits.json';
import { Trait, TraitSpec } from './models/Trait';

beforeEach(() => {
  (Trait as any).specById = new Map<string, TraitSpec>();
  Trait.registerSpecs(traits as any);
});

describe('RecruitService', () => {
  it('persists recruits and settlement renown', () => {
    const svc = new RecruitService();
    svc.addSettlementRenown(5000);
    const r = svc.createRecruit('blacksmith');
    svc.assignRecruit(r.id, 'blacksmith');

    const saved = svc.save();

    const svc2 = new RecruitService();
    svc2.load(saved);

    expect(svc2.getSettlementRenown()).toBe(5000);
    expect(svc2.getRecruit(r.id)?.assignedBuilding).toBe('blacksmith');
  });
});
