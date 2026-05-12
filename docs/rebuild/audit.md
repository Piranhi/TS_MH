# Current Project Audit

## Snapshot

- Name/package: `monster-hunter-ui`
- Stack actually installed in config: TypeScript, Vite, Vitest
- UI actually used: custom DOM components, HTML fragments, CSS files
- Claimed stack in `AI_GUIDE.md`: React, TailwindCSS, shadcn/ui
- Steam support: goal only; no desktop shell or Steam integration pipeline exists yet
- Dependencies: `node_modules` is absent, so commands cannot currently run without install

## Content Inventory

The project contains useful content drafts:

- 10 hunt areas
- 68 monsters
- 7 equipment specs including debug equipment
- 31 resources
- 15 milestone specs
- 12 progression triggers
- 8 abilities
- 5 classes
- 6 buildings

These are worth treating as design seeds, not production-ready data.

## Best Parts To Keep

- Data-driven content: areas, monsters, abilities, equipment, buildings, resources, milestones.
- Central balance file: `src/balance/GameBalance.ts` is a good idea, even if some formulas need review.
- Explicit hunt state machine: Search -> Combat -> Recovery is the correct core idle loop.
- Run vs persistent split: `GameRun` and `GameServices` point toward a useful prestige architecture.
- Saveable systems: registering save slices per system is a good pattern.
- Offline progress as a first-class system: keep this as a design requirement.
- Reward system: one reward entry point is the right direction.
- Modifier layers: the concept is strong for long-term balance and patchability.
- Tests exist for resources, offline loot, recruits, and events. The rebuild should start with this habit.

## Main Problems To Leave Behind

- The docs and implementation disagree about the stack.
- Core managers depend on DOM APIs, `document`, `window`, and UI element IDs.
- Many systems reach through `GameContext.getInstance()`, making testing and ordering fragile.
- Event names are inconsistent. Some events are emitted but not typed in `GameEvents`.
- `EventBus` tests expect replaying the latest value, but the implementation has that behavior disabled.
- `SaveManager.clearSaves()` is currently a no-op.
- `SaveManager` creates a global exported instance while `GameServices` creates another one.
- `HuntManager` saves and loads UI dropdown state directly.
- Several systems mix design logic, persistence, UI, debug behavior, and DOM behavior in one class.
- Prestige, offline progress, and transient run state are partly implemented but not yet cleanly separated.
- Large CSS and DOM screens make it hard to reason about user flows.

## Data Issues Found

A quick reference check found 213 warnings. The useful categories are:

- Area drop tags often use comma strings like `"t2, rare"` instead of separate tags.
- Areas tier 4 and later require milestones that are missing from `milestones.json`.
- Progression triggers unlock several missing milestone IDs such as `hunt.boss.tier3`, `building.blacksmith`, and `research.speed.10`.
- Most tier 2+ resources have empty requirements like `{}`.
- `forge_flux` requires `iron_bar`, but the resource is called `iron_ingot`.
- Many resource icons are referenced but missing.
- Most monster images are referenced but missing.
- Equipment beyond tier 1 does not exist yet, so higher-tier area drops cannot resolve.
- Several descriptions and class node labels are placeholders.

## Verification State

`npm test` currently fails because Vitest is not installed locally:

```text
'vitest' is not recognized as an internal or external command
```

Git status is also blocked by a safe-directory ownership warning in this checkout. That is not a rebuild blocker, but it should be fixed before committing changes from this folder.

## Carry Forward As Requirements

- Every content file gets schema validation.
- Every ID reference must be checked in tests.
- The core game loop must run headless in tests.
- Saves must be versioned and migratable from day one.
- UI must be an adapter over state, not the owner of game logic.
- Steam concerns must be isolated behind a platform adapter.

