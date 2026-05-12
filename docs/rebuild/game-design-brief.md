# Game Design Brief

## Working Concept

A fantasy idle RPG for Steam where the player grows a hunter, explores dangerous regions, defeats bosses, collects gear and resources, and eventually builds toward legacy/bloodline systems. Browser support should remain possible later, but Steam is the main platform.

The rebuild should start with the first 5-10 hours of fun. The old project was aiming at the final game too early.

## Design Pillars

- Simple first, deep later.
- Clear idle loop with satisfying progress while away.
- Short-term MVP first, long-term systems later.
- Long-term progression through compounding systems, not confusing menus.
- Clear power progression: every area should feel like a meaningful step up, and every boss should feel like a gate.
- Manual first, automate later: introduce a mechanic by making the player use it directly, then unlock QoL automation once the mechanic is understood.
- Content should be data-driven and easy to patch.
- Saves must survive updates.
- Steam version should feel like a complete desktop game, not a web page in a wrapper.

## Core Loop

1. Choose an area.
2. Search automatically.
3. Encounter monsters.
4. Resolve combat automatically from a small set of stats and simple formulas.
5. Gain XP, gold, renown, loot, resources, kills, and unlock progress.
6. Recover when defeated.
7. Manually attempt the area boss after enough progress.
8. Unlock harder areas and better loot.
9. Build toward prestige/legacy systems after the MVP loop is fun.

## Primary Progression Systems

## Hunter

- Levels during a run.
- MVP stats should be minimal: health, attack, defence, speed, crit chance, and luck/gathering if needed.
- Avoid active ability timing, complex stamina loops, deep elemental resistance, and status-effect systems in MVP.
- Gains passive upgrades from training, gear, and simple unlocks.
- Resets or partially resets on prestige depending on final design.
- One main hunter for MVP. Bloodlines/legacies can become a later expansion layer.

## Combat

- Fully automatic.
- MVP combat should not simulate complex rotations, cooldown priority, status effects, mana, stamina, lifesteal, elemental resistance, or multi-effect ability packets.
- Start with a simple power comparison and kill-time model.
- A hunt should produce understandable rates: hunts per hour, XP per hour, gold per hour, materials per hour.
- Detailed combat can return later only if it improves idle decisions.

## Areas And Monsters

- Areas are ordered by tier.
- Each area has weighted regular spawns and one boss.
- Boss clears unlock future tiers and features.
- Monster kill history can feed the bestiary and permanent bonuses.
- Boss attempts are manual in MVP. Auto-boss is a later QoL unlock.

## Equipment

- Gear drops from monsters by tier and tags.
- Equipment gives simple buffs.
- Equipment carries stats, rarity, value, and possibly upgrade potential.
- No resistances in MVP.
- Equipment should be one of the major long-term reasons to keep idling.
- MVP equipment can start with fewer slots and fewer stat types.

## Resources And Blacksmith

- Resources unlock through mining, crafting, area progress, or resource mastery.
- Blacksmith turns resources into gear upgrades and crafting speed.
- Resource mastery is a strong idea: levelling a resource can unlock new resources and prestige carryover.
- MVP blacksmith can be a simple upgrade sink, not a full crafting economy.

## Settlement

- Outside MVP.
- Settlement, buildings, recruits, staffing, and production bonuses can return after the hunter/area/boss/inventory loop is fun.

## Classes

- Class is persistent across runs unless we decide otherwise.
- Class trees grant stat bonuses, ability unlocks, and build identity.
- Initial classes: Warrior, Priest, Rogue, Mage, Protector.
- MVP should probably start with one hunter path, not five full classes.

## Offline Progress

- Offline progress should be transparent and predictable.
- It should summarize what changed: kills, XP, gold, renown, resources, loot, research, training, blacksmith work.
- It should use the same reward rules as online play where possible.

## Automation Unlocks

- Automation is a core reward type.
- A system should start manual so the player understands it.
- Once repeated use becomes mildly tedious, the game can offer an automation unlock.
- Automation should feel earned, not like the game playing itself from minute one.
- MVP example: boss attempts start manual; auto-boss becomes a later unlock.

## Prestige

- Prestige should reset the active run and strengthen the next one.
- Persistent rewards may include bloodline stats, build points, resource carryover, class progress, settlement progress, and heirloom gear.
- The exact reset rules need a decision before implementation.

## MVP Scope

The first rebuild should not try to recreate every screen. It should prove a small complete 5-10 hour experience:

- 3 areas
- 6 to 8 monsters
- 1 boss chain
- 1 hunter path
- passive upgrades, not a full ability system
- 6 to 10 equipment items
- 3 to 5 resources
- simple inventory/equipment decisions
- save/load
- offline progress
- one prestige decision or first prestige preview

## Content To Borrow First

- Area names and tier order from `src/data/areas.json`.
- Early monsters from tier 1 to tier 3.
- Resource mastery idea from `src/data/resources.json` and `ResourceManager`.
- Search -> Combat -> Recovery loop from `HuntManager`.
- Central balance categories from `GameBalance.ts`.
- Visual language from `visual-style.md`.
- Some settlement flavor can be preserved for later, but it should not shape the MVP.
