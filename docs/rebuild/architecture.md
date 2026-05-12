# Proposed Rebuild Architecture

## Goal

Create a game that is easy to test, patch, package for Steam, and expand over years.

## High-Level Shape

```text
game-core/
  Pure simulation, data validation, save schema, formulas, tests.

game-ui/
  Screens, components, animation, input, rendering, accessibility.

platform/
  Steam shell, filesystem saves, achievements, cloud hooks, future browser storage.

content/
  JSON or TS data files for areas, monsters, equipment, abilities, resources, milestones.
```

The important rule: `game-core` does not import DOM, browser storage, Steam APIs, or UI components.

## Recommended Boundaries

## Core Simulation

Owns:

- game clock
- hunt state machine
- simple automatic hunt/combat resolution
- reward generation
- progression and unlocks
- equipment buff calculations
- prestige calculations
- offline simulation
- save/load data shape

Does not own:

- HTML elements
- modal display
- CSS classes
- Steam APIs
- localStorage directly
- browser visibility events directly
- filesystem APIs directly

## UI Layer

Owns:

- rendering screens
- handling clicks and inputs
- showing toasts and modals
- presenting offline summaries
- layout and styling

The UI should call core commands and subscribe to core snapshots/events.

## Platform Layer

Owns:

- save storage adapter
- Steam desktop shell
- Steam achievements/stats adapter
- file paths and cloud-save compatibility
- crash-safe save writes
- later browser storage adapter

## Suggested Runtime Decisions

These should be confirmed before creating the new folder:

- UI framework: React, Svelte, Solid, or custom DOM.
- Desktop shell: Electron or Tauri.
- Data format: JSON with schemas, or TypeScript content modules.
- State model: event-sourced commands, reducer/store, or service classes with snapshots.

My current recommendation is:

- TypeScript everywhere.
- Pure core package with Vitest tests.
- A modern component UI rather than hand-managed DOM.
- JSON content with schema validation and reference tests.
- Platform adapter for browser vs Steam desktop.
- Start with a simple formula-driven combat model, not the old cooldown/status/effect simulation.
- Steam-first saves through a platform adapter, with browser saves left as a later adapter.

## Core Loop API Sketch

```ts
type GameCommand =
  | { type: "selectArea"; areaId: string }
  | { type: "toggleAutoBoss"; enabled: boolean }
  | { type: "equipItem"; itemId: string; slot: string }
  | { type: "sellItem"; itemId: string }
  | { type: "prestige" };

type GameSnapshot = {
  time: number;
  run: RunSnapshot;
  player: PlayerSnapshot;
  hunt: HuntSnapshot;
  inventory: InventorySnapshot;
  settlement: SettlementSnapshot;
  unlocks: UnlockSnapshot;
};
```

The UI should render `GameSnapshot` and send `GameCommand`. This makes the game testable and makes Steam packaging much easier.

## Simplified Combat Model

The old combat system had abilities, stamina, status effects, priority queues, effect packets, and cooldown simulation. The rebuild should not start there.

MVP combat can begin as:

```text
hunterPower = attack * speed * gearMultiplier * passiveMultiplier
monsterPower = monsterHealth * monsterDefence * areaMultiplier
killTime = clamp(monsterPower / hunterPower, minKillTime, maxKillTime)
successRate = compare(hunterSurvival, monsterThreat)
```

The player should understand outcomes through rates:

- hunts per hour
- XP per hour
- gold per hour
- materials per hour
- boss readiness

This keeps the idle game legible and leaves room for deeper mechanics later.

No MVP resistances, elements, status effects, or active ability rotations. Items add buffs only.

## Save Strategy

- One save root with `_version`, `_createdAt`, `_updatedAt`, and named slices.
- Migrations live beside save schema definitions.
- Save writes should be atomic in the Steam desktop build.
- Autosave should be debounced and explicit after important actions.
- Tests should load saves from previous versions.
- Browser save support should be an adapter added later, not a reason to compromise the Steam save path.

## Data Validation Strategy

Every content build should check:

- unique IDs
- references exist
- assets exist or intentionally use fallback art
- area drop tags match loot tables
- milestone unlocks exist
- ability references exist
- resource requirements exist
- no empty placeholder requirements
- no accidental comma-packed tags

## Steam Requirements To Plan Early

- Desktop window scaling and fullscreen.
- Local save location.
- Steam Cloud compatibility.
- Achievements and stats.
- Offline play with no required network.
- Controller/keyboard friendliness if desired.
- Build pipeline that creates repeatable release artifacts.
