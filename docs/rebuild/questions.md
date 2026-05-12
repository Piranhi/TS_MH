# Rebuild Questions

These are the decisions that matter before we create the fresh folder.

## Answered So Far

- Working title: TBD. Current "Monster Hunter" wording is placeholder and likely needs changing before Steam.
- Core fantasy: one main hunter for MVP. Bloodlines/legacies may come later.
- Visual style: use the new reference images in `references/` and `visual-style.md`.
- Combat: fully automatic and much simpler than the old implementation.
- MVP scope: first 5-10 hours of fun, built in stages. Do not build the final game first.
- Prestige persistence: broadly yes to keeping the listed persistent systems, but simplify what actually appears in MVP.
- Platform: Steam-first. Keep browser support possible later, especially through save/storage adapters.
- Settlement and building systems are outside MVP.
- Items should add buffs only. No resistances in MVP.
- Progression must be obvious: each area is substantially harder than the last, and each boss is substantially harder than its area.
- Automation pillar: mechanics start manual, become lightly tedious after mastery, then unlock QoL automation.
- Bosses: manual attempts first. Auto-boss is a later unlock/QoL reward.

## Game Identity

1. What is the actual working title? The current project says Monster Hunter in places, which may be risky/confusing for a Steam game.
2. Is the fantasy "guild and settlement supporting one hunter" still the target, or should it become party/guild management?
   - Answer: one main hunter for MVP. Bloodlines/legacies can arrive later.
3. Should the tone be cozy idle fantasy, dark monster slaying, comedic, or serious progression RPG?

## Core Loop

4. Should combat be fully automatic, or should the player make occasional build/ability decisions?
   - Answer: fully automatic.
5. Should bosses be manual challenge buttons, automatic once unlocked, or both?
   - Answer: manual first. Auto-boss becomes an unlock later.
6. How long should the first prestige take in the intended MVP: 30 minutes, 2 hours, 8 hours, or longer?
   - Updated framing: MVP should cover the first 5-10 hours of fun.

## Reset Rules

7. What persists through prestige?
   - class progress
   - settlement buildings
   - recruits
   - equipment
   - resource levels
   - resource quantities
   - bestiary kills
   - permanent stats
8. What should always reset on prestige?

## Steam And Platform

9. Is Steam the only target, or do you also want a browser/web build?
   - Answer: Steam is the main platform. Keep browser support in mind for later.
10. Do you want Steam achievements and stats in the MVP, or only after the core loop is good?
11. Should the game support offline play indefinitely, or cap offline progress after a fixed time?

## UI And Tech

12. Do you want to keep the frosted-glass visual style, or use the rebuild to choose a cleaner desktop idle-game interface?
   - Answer: use the new provided image references, not the old frosted-glass style.
13. Are you happy moving to a component framework such as React/Svelte/Solid, or do you prefer custom DOM with stricter boundaries?
14. Should the new build prioritize keyboard/controller-friendly desktop controls?

## Content Scope

15. Which current system is the soul of the game: hunting, gear upgrading, settlement, classes, or prestige?
16. Which current systems should be cut from MVP even if they return later?
17. Do you want a story/dialogue layer, or should lore stay in item/area descriptions for now?

## My Suggested Default Answers

If you want me to make the first call, I would start with:

- one hunter, not a party
- automatic combat with build choices outside combat
- boss fights can be manual, with an auto-boss option later
- first prestige target around 2 hours during prototype balance
- keep class, settlement, recruits, bestiary, resource levels, and permanent stats through prestige
- reset character level, active area progress, resource quantities, and temporary run traits
- build web plus Steam desktop from the same codebase
- defer Steam achievements until after the first full loop
- use a component UI and a pure TypeScript game core

## Remaining Questions To Answer Next

1. For prestige: is there a prestige action in MVP, or only a preview of future legacy/bloodline systems?
2. Should inventory items be permanent until sold, or should early MVP gear be disposable/replaceable with no upgrade history?
3. What should the first automation unlock be: auto-boss, auto-sell, auto-equip suggestions, or offline expedition automation?
