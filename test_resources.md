# Resource Unlock System Test

## Overview
The resource unlock system has been updated to support level-based unlocks. Resources can now specify what should be unlocked at specific levels.

## Changes Made

1. **Type Changes**:
   - Changed `ResourceSpec.unlock: string[]` to `ResourceSpec.unlocks?: Array<{level: number, id: string}>`
   - Updated `Resource.unlock` getter to `Resource.unlocks` getter

2. **ResourceManager Changes**:
   - Added `processLevelUnlocks()` method to handle level-based unlocks
   - Modified `addResourceXP()` to check for unlocks when leveling up
   - Unlocks are processed immediately when a resource reaches the specified level

3. **JSON Data Changes**:
   - Changed "unlock" to "unlocks" format:
     ```json
     "unlocks": [{"level": 25, "id": "charstone"}]
     ```

4. **UI Changes**:
   - Updated BlacksmithScreen to show unlock information in tooltips
   - Tooltips now display both completed and upcoming unlocks with visual indicators:
     - ✓ Unlocked [Resource Name] at level [X]
     - 🔒 Unlocks [Resource Name] at level [X]

## Test Cases

### Basic Unlock Test
- Iron Ingot reaches level 25
- Should unlock Charstone resource
- Tooltip should show "✓ Unlocked Charstone at level 25"

### Multiple Unlocks
- Resources can have multiple unlocks at different levels
- Each unlock is processed independently when the level is reached

### Tooltip Display
- Before level 25: "🔒 Unlocks Charstone at level 25"
- After level 25: "✓ Unlocked Charstone at level 25"

## Example Usage

```json
{
  "id": "iron_ingot",
  "name": "Iron Ingot",
  "unlocks": [
    {"level": 25, "id": "charstone"},
    {"level": 50, "id": "steel_ingot"}
  ]
}
```

This resource will unlock:
- Charstone at level 25
- Steel Ingot at level 50

## Implementation Details

The system maintains backward compatibility by making the `unlocks` field optional. Resources without unlocks will work as before.

The unlock system integrates with the existing resource leveling mechanism, checking for unlocks each time a resource levels up.