---
description: High-level goals and style guide for Monster-Hunter Idle
alwaysApply: true
tags: [guide, style]
---

# Monster Hunter Idle – AI Guide

## 1. Goal

- Build an **incremental / idle** adventure set in a fantasy **world**.
- Target **> 1 year** of slow-burn progression; numbers grow but stay readable.
- Players unlock gear, recruit allies, gather resources, and train skills.
- Currencies: gold, renown, XP (plus future special tokens).
- Each run has a character; **player class is persistent** across runs.
- Core loop: clear hunt areas → grow stronger → tackle harder hunts.
- Platforms: Web (primary) and Steam desktop build.

## 2. Design Pillars

- **Prefer simple systems.** If two solutions exist, ship the simpler.
- Ship an **MVP**, then expand via patches (gear, zones, prestige layers).
- **Backward compatible** updates—old saves must load after patches.
- Depth through synergies, not complexity: easy to learn, hard to master.

## 3. Coding Rules

1. Functional React components only.
2. State lives in feature-level managers—not React context.
3. UI components remain pure (no game logic).

## 4. Near-term Road-map

- [ ] Implement equipment rarity & tooltip stats.
- [ ] Design monster-encounter generator.
- [ ] Add offline-progress calculation.

## 5. Long-term Road-map

- [ ] Steam / executable bundling pipeline.

## 6. Gotchas

- Avoid circular imports between Managers.
- Some systems reset when prestiging, some are persistent

## 7. Tech Stack

- **TypeScript** + Vite
- **React** + shadcn/ui components
- **TailwindCSS** (frosted-glass theme)
- EventBus pattern for intra-app messaging
