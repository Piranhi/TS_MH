# Monster Hunter Idle Rebuild Notes

This folder is the reset point for planning a clean rebuild. The current project has useful design work and content, but the implementation has grown tangled enough that the safest path is to extract the best ideas, define the new foundation, then start fresh in a new folder.

## Files

- `audit.md` - what exists today, what is worth keeping, and what should be left behind.
- `game-design-brief.md` - the clean version of the game concept and systems.
- `visual-style.md` - visual direction based on the new reference images.
- `progression-model.md` - MVP scaling rules for hunter power, areas, bosses, loot, and unlocks.
- `architecture.md` - proposed technical shape for the rebuild.
- `mvp-roadmap.md` - phased rebuild plan with acceptance criteria.
- `questions.md` - decisions to answer before creating the new project folder.

## Current Read

The project is a TypeScript/Vite browser idle game with custom DOM UI. It contains a strong early shape: data-driven areas, monsters, equipment, resources, unlocks, offline progress, settlement systems, class trees, a save registry, and a hunt loop.

The messy part is not the idea. The messy part is the implementation boundary: game state, UI, persistence, events, and content validation are too intertwined. The rebuild should keep the design direction, content drafts, and some formulas, but rebuild the foundation deliberately.

## Rebuild Principle

Build the core simulation first, without DOM, Steam, visual effects, or save-file assumptions. Once the loop is reliable in tests, attach UI and desktop/Steam packaging around it.

## Suggested Next Move

Confirm the few remaining open questions in `questions.md`, then create a fresh project folder with the agreed stack and a tiny playable vertical slice:

1. Pick area.
2. Auto hunt.
3. Resolve combat.
4. Award XP/gold/renown/loot.
5. Save/load.
6. Calculate offline progress.

The MVP target is now the first 5-10 hours of fun, not the final version of the game. The MVP focuses on one hunter, areas, exploration, bosses, inventory, equipment buffs, and clear progression. Settlement/building systems are parked for later.

Core progression pillar: introduce mechanics manually first, let the player understand them, let light repetition create desire, then unlock automation as a reward.
