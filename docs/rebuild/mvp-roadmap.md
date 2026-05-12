# MVP Roadmap

The MVP target is the first 5-10 hours of fun. It should feel like a real idle game slice, not a miniature version of the final game plan.

MVP focus: one hunter, areas, exploration, bosses, inventory, equipment buffs, rewards, saves, and offline progress. Settlement and buildings are outside MVP.

Automation rule: mechanics are introduced manually first, then automation is unlocked later as QoL progression.

## Phase 0 - Decisions And Setup

Goal: create the new project with the right boundaries.

Acceptance criteria:

- Stack chosen.
- Desktop shell choice recorded.
- New folder created.
- Core package can run tests.
- Content validation test exists.
- Basic save schema exists with versioning.

## Phase 1 - Headless Game Core

Goal: prove the game works without UI.

Build:

- tick-based game clock
- area selection
- Search -> Hunt Result -> Recovery loop
- simple automatic combat model
- manual boss attempts
- reward generation
- player XP and level-up
- gold, renown, and loot inventory
- save/load
- area and boss power scaling rules

Acceptance criteria:

- Tests can simulate 10 minutes of hunting.
- A boss kill unlocks the next area.
- Bosses are not auto-attempted by default.
- Save/load produces the same state.
- No core file imports DOM/browser APIs.
- Combat is understandable from a small formula and a few stats.
- Each area has a target power band and each boss has a clear power spike.

## Phase 2 - First Playable UI

Goal: make the loop playable.

Build:

- main app shell
- hunt screen
- character stats panel
- compact inventory/equipment panel
- area selector
- combat log or compact encounter feed
- save/load hooks
- visual direction based on `visual-style.md`

Acceptance criteria:

- Player can launch, select area, watch combat, gain loot, equip items, and reload.
- UI displays the same state as core tests.
- No game rule lives only in UI code.

## Phase 3 - Progression Slice

Goal: add the first real idle progression.

Build:

- 3 areas
- 1 boss chain
- 1 hunter upgrade path
- 3 to 5 resources
- equipment buffs only
- first QoL automation unlock candidate, likely auto-boss
- one prestige decision or first prestige preview
- offline progress summary

Acceptance criteria:

- The first 5-10 hours are fun and understandable.
- Offline progress uses the same reward rules as online play.
- Data validation passes with no missing references.
- No system exists only because it was planned for the final game.
- No settlement/building/recruit screens in MVP.
- At least one mechanic demonstrates the manual-first, automate-later pillar.

## Phase 4 - Steam Foundation

Goal: package the playable vertical slice for desktop.

Build:

- desktop shell
- local save adapter
- Steam adapter stub
- achievement/stat design draft
- release build script
- window scaling pass
- browser save adapter kept possible, but not prioritized

Acceptance criteria:

- Local desktop build runs without dev server.
- Save path is known and stable.
- Steam integration points are isolated from core and UI.
- Browser support can be added later without rewriting core saves.

## Phase 5 - Content Expansion

Goal: scale from prototype to real game.

Build:

- more classes
- more areas
- gear tiers
- recruit staffing
- settlement buildings
- bestiary bonuses
- more prestige rewards
- balance tooling
- deeper combat only if the MVP proves it is needed

Acceptance criteria:

- Adding a new area/monster/item is mostly content work.
- Balance curves can be tested or graphed.
- Old saves migrate cleanly.
