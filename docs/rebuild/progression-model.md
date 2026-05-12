# MVP Progression Model

This document defines the simple progression rules for the first 5-10 hours.

## Goals

- Progression should be obvious.
- Each area should be substantially harder than the last.
- Each boss should be substantially harder than regular enemies in the area.
- Gear should give simple buffs.
- The player should understand why they are stuck and what will make them stronger.

## Core Power Score

Use a simple power score for MVP balancing.

```text
hunterPower =
  attack
  * speedFactor
  * critFactor
  * gearBuffFactor
  * passiveBuffFactor

hunterSurvival =
  health
  * defenceFactor

effectiveHunterPower =
  hunterPower
  * survivalGate
```

The exact formula can change, but the player-facing result should stay clear:

- power
- health
- defence
- hunts per hour
- boss readiness

## Enemy Scaling

Each area has a target power band.

```text
areaPower[tier] = baseAreaPower * areaGrowth ^ (tier - 1)
regularEnemyPower = areaPower[tier] * enemyVariantMultiplier
bossPower = areaPower[tier] * bossMultiplier
```

Suggested starting values:

- `baseAreaPower`: 100
- `areaGrowth`: 2.2 to 2.8
- `enemyVariantMultiplier`: 0.8 to 1.2
- `bossMultiplier`: 2.5 to 4.0

This makes a new area feel like a real jump, while still allowing gear and levels from the previous area to bridge the gap.

## Kill Time

```text
killTimeSeconds = clamp(enemyPower / effectiveHunterPower * baseKillTime, minKillTime, maxKillTime)
```

Suggested starting values:

- `baseKillTime`: 10 seconds
- `minKillTime`: 2 seconds
- `maxKillTime`: 120 seconds

If the hunter is far below the area power band, kill time becomes slow and boss success should be poor. If the hunter is far above it, the area becomes farm content.

## Boss Gates

Bosses are progression checks.

- Regular enemies teach the area.
- Area progress fills through hunts.
- Boss unlocks after enough area progress.
- Boss is much harder than the area.
- Beating the boss unlocks the next area.

Boss attempts are manual in MVP. Auto-boss is a later QoL unlock.

## Automation Progression

Automation is part of progression, not a default convenience.

The pattern:

```text
learn mechanic manually -> repeat it enough to understand it -> unlock automation -> enjoy faster flow
```

MVP boss example:

- Player fills area progress manually through hunting.
- Boss becomes available.
- Player presses `Attempt Boss`.
- After enough boss clears, area mastery, or a later unlock, auto-boss becomes available.

This gives the player something to look forward to without adding a complicated new system.

## Item Buffs

Every item adds a buff. No resistances in MVP.

Example item effects:

- `attackPercent`
- `attackFlat`
- `healthPercent`
- `defencePercent`
- `speedPercent`
- `critChanceFlat`
- `goldFindPercent`
- `xpGainPercent`
- `materialFindPercent`

Item tier should roughly match area tier. New area loot should help the player farm that area faster and prepare for its boss.

## Loot Progression

Each area should offer:

- one common weapon or attack item
- one defence or health item
- one utility item
- one material used by later upgrades or selling

Early MVP should avoid too many equipment slots. More slots can come later.

## Area Progression Example

```text
Area 1: player learns hunt loop and gets first gear.
Area 1 boss: requires basic gear or a few levels.
Area 2: regular enemies are harder than Area 1 boss farming.
Area 2 boss: requires Area 2 gear and higher level.
Area 3: introduces slower progress and first prestige preview.
```

## Balance Tests

Automated tests should verify:

- Area 1 is beatable from a fresh save.
- Area 2 is not instantly beatable from a fresh save.
- Area 1 boss is harder than Area 1 regular enemies.
- Area 2 regular enemies are meaningfully harder than Area 1 regular enemies.
- Area 2 loot improves Area 2 farming speed.
- Offline rewards follow the same rates as online rewards.
