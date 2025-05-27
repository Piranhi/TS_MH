// src/balance/GameBalance.ts
// ===================================================
// Centralized Game Balance Configuration
// Single source of truth for all scaling values
// ===================================================
export const GAME_BALANCE = {
	// === MONSTER SCALING ===
	monsters: {
		// Per-tier growth rates (from Stats.ts)
		hpGrowthPerTier: 1.75, // HP ×1.75 per area tier
		attackGrowthPerTier: 1.45, // Attack ×1.45 per area tier
		defenseGrowthPerTier: 1.4, // Defense ×1.40 per area tier

		// Renown multipliers by rarity (from Monster.ts)
		renownMultipliers: {
			common: 1.0,
			uncommon: 1.2,
			rare: 1.5,
			terrifying: 2.0,
			nightmare: 3.0,
		},

		// Base scaling multiplier for area calculations
		baseScalingMultiplier: 10, // from Area.ts growth() method
	},

	// === PLAYER CHARACTER SCALING ===
	player: {
		// XP system
		xpThresholdMultiplier: 1.75, // XP needed increases by 75% per level

		// Level bonus growth rates (exponential)
		levelBonuses: {
			attackBase: 1.2, // 20% compound growth per level
			defenseBase: 1.15, // 15% compound growth per level
			utilityBase: 1.1, // 10% compound growth per level
		},

		// Base stat values for level 1 (multiplied by growth rates)
		baseStats: {
			attack: 5,
			hp: 50,
			defense: 3,
			power: 2,
			guard: 2,
			speed: 1,
			critChance: 0.5,
			critDamage: 1,
		},
	},

	// === EQUIPMENT SCALING ===
	equipment: {
		// Rarity multipliers (from types.ts)
		rarityMultipliers: {
			common: 1.0,
			uncommon: 1.1,
			rare: 1.25,
			epic: 1.5,
			legendary: 2.0,
			unique: 3.0,
		},
	},

	// === BUILDING SCALING ===
	buildings: {
		// Cost multiplier per level (from levelling-types.ts)
		costMultiplier: 2.25,
	},

	// === AREA SCALING ===
	areas: {
		// Tier multipliers (from types.ts)
		tierMultipliers: [1, 1.2, 1.5, 2, 2.5, 3],
	},

	// === COMBAT SCALING ===
	combat: {
		// Defense mitigation constant (from EffectProcessor.ts)
		defenseConstant: 100,

		// Damage variance range
		damageVariance: {
			min: 0.9, // -10%
			max: 1.1, // +10%
		},
	},

	// === TRAINING SCALING ===
	training: {
		// Maximum efficiency rate (from TrainedStat.ts)
		maxBarsPerSecond: 10,

		// Diminishing returns formula constants
		diminishingReturns: {
			baseMultiplier: 0.05,
			levelExponent: 0.5,
			levelMultiplier: 8,
		},
	},

	// === DROP SCALING ===
	loot: {
		// Base drop chances that scale with area tier
		baseDropChance: 0.01,
		dropDecayFactor: 0.9, // Drops get rarer in higher tiers
		dropFloorChance: 0.005, // Minimum drop chance
	},
} as const;

// ===================================================
// Balance Calculator Functions
// Complex formulas that use the balance constants
// ===================================================

export const BalanceCalculators = {
	// === MONSTER CALCULATIONS ===

	/**
	 * Calculate monster stat for given tier
	 * @param baseStat - Base stat value from monster spec
	 * @param tier - Area tier (1-based)
	 * @param statType - Which stat to calculate
	 */
	getMonsterStat(baseStat: number, tier: number, statType: "hp" | "attack" | "defense"): number {
		const growthKey = `${statType}GrowthPerTier` as const;
		const multiplier = GAME_BALANCE.monsters[growthKey];
		const areaMultiplier = GAME_BALANCE.monsters.baseScalingMultiplier;

		return Math.floor(baseStat * areaMultiplier * Math.pow(multiplier, tier - 1));
	},

	/**
	 * Get renown reward for killing a monster
	 */
	getMonsterRenown(baseTier: number, rarity: keyof typeof GAME_BALANCE.monsters.renownMultipliers): number {
		const rarityMultiplier = GAME_BALANCE.monsters.renownMultipliers[rarity];
		return Math.floor(baseTier * rarityMultiplier);
	},

	// === PLAYER CALCULATIONS ===

	/**
	 * Calculate player stat bonus from character level
	 * @param level - Character level (1-based)
	 * @param statCategory - Which category of stat
	 */
	getPlayerLevelBonus(level: number, statCategory: "attack" | "defense" | "utility"): number {
		const baseKey = `${statCategory}Base` as const;
		const base = GAME_BALANCE.player.levelBonuses[baseKey];
		return Math.pow(base, level - 1);
	},

	/**
	 * Get all player level bonuses for a given level
	 */
	getAllPlayerLevelBonuses(level: number) {
		const attackMultiplier = this.getPlayerLevelBonus(level, "attack");
		const defenseMultiplier = this.getPlayerLevelBonus(level, "defense");
		const utilityMultiplier = this.getPlayerLevelBonus(level, "utility");

		return {
			attack: Math.floor(GAME_BALANCE.player.baseStats.attack * attackMultiplier),
			hp: Math.floor(GAME_BALANCE.player.baseStats.hp * attackMultiplier),
			defense: Math.floor(GAME_BALANCE.player.baseStats.defense * defenseMultiplier),
			power: Math.floor(GAME_BALANCE.player.baseStats.power * defenseMultiplier),
			guard: Math.floor(GAME_BALANCE.player.baseStats.guard * defenseMultiplier),
			speed: Math.floor(GAME_BALANCE.player.baseStats.speed * utilityMultiplier),
			critChance: Math.floor(GAME_BALANCE.player.baseStats.critChance * utilityMultiplier),
			critDamage: Math.floor(GAME_BALANCE.player.baseStats.critDamage * utilityMultiplier),
		};
	},

	/**
	 * Calculate XP threshold for next level
	 */
	getXPThreshold(currentLevel: number): number {
		const base = 100; // Base XP for level 1->2
		return Math.floor(base * Math.pow(GAME_BALANCE.player.xpThresholdMultiplier, currentLevel - 1));
	},

	// === EQUIPMENT CALCULATIONS ===

	/**
	 * Apply rarity scaling to equipment stats
	 */
	scaleEquipmentStat(baseStat: number, rarity: keyof typeof GAME_BALANCE.equipment.rarityMultipliers): number {
		const multiplier = GAME_BALANCE.equipment.rarityMultipliers[rarity];
		return Math.floor(baseStat * multiplier);
	},

	// === BUILDING CALCULATIONS ===

	/**
	 * Calculate building upgrade cost
	 */
	getBuildingCost(baseCost: number, currentLevel: number): number {
		return Math.floor(baseCost * Math.pow(GAME_BALANCE.buildings.costMultiplier, currentLevel));
	},

	// === COMBAT CALCULATIONS ===

	/**
	 * Calculate damage mitigation from defense
	 */
	calculateMitigation(defense: number): number {
		const defenseConstant = GAME_BALANCE.combat.defenseConstant;
		return defense / (defense + defenseConstant);
	},

	/**
	 * Apply damage variance
	 */
	applyDamageVariance(damage: number): number {
		const { min, max } = GAME_BALANCE.combat.damageVariance;
		const variance = min + Math.random() * (max - min);
		return Math.floor(damage * variance);
	},
} as const;

// ===================================================
// Debug & Testing Functions
// ===================================================

export const BalanceDebug = {
	/**
	 * Print progression curves for balancing
	 */
	logProgressionCurves() {
		console.log("=== BALANCE PROGRESSION CURVES ===");

		const levels = [1, 5, 10, 15, 20];
		const tiers = [1, 2, 3, 4, 5];

		// Player progression
		console.log("\n--- Player Level Progression ---");
		levels.forEach((level) => {
			const bonuses = BalanceCalculators.getAllPlayerLevelBonuses(level);
			console.log(`Level ${level}:`, bonuses);
		});

		// Monster progression
		console.log("\n--- Monster Tier Progression ---");
		tiers.forEach((tier) => {
			const hp = BalanceCalculators.getMonsterStat(100, tier, "hp");
			const attack = BalanceCalculators.getMonsterStat(10, tier, "attack");
			console.log(`Tier ${tier}: HP=${hp}, Attack=${attack}`);
		});

		// Power comparison
		console.log("\n--- Power Balance Check ---");
		levels.forEach((level) => {
			const playerAttack = BalanceCalculators.getAllPlayerLevelBonuses(level).attack;
			const monsterHP = BalanceCalculators.getMonsterStat(100, Math.ceil(level / 4), "hp");
			const turnsToKill = Math.ceil(monsterHP / playerAttack);
			console.log(`Level ${level} vs Tier ${Math.ceil(level / 4)}: ${turnsToKill} turns to kill`);
		});
	},

	/**
	 * Test if player can progress through content
	 */
	validateBalance() {
		console.log("=== BALANCE VALIDATION ===");

		let issues = [];

		// Check if player damage scales faster than monster HP
		for (let level = 1; level <= 20; level += 5) {
			const tier = Math.ceil(level / 4);
			const playerAttack = BalanceCalculators.getAllPlayerLevelBonuses(level).attack;
			const monsterHP = BalanceCalculators.getMonsterStat(100, tier, "hp");

			const turnsToKill = Math.ceil(monsterHP / playerAttack);
			if (turnsToKill > 50) {
				issues.push(`Level ${level}: Takes ${turnsToKill} turns to kill tier ${tier} monsters`);
			}
		}

		if (issues.length === 0) {
			console.log("✅ Balance looks good!");
		} else {
			console.log("⚠️ Balance issues found:");
			issues.forEach((issue) => console.log(`  - ${issue}`));
		}
	},
};

// Export individual constants for backwards compatibility during migration
export const MONSTER_HP_GROWTH = GAME_BALANCE.monsters.hpGrowthPerTier;
export const MONSTER_ATTACK_GROWTH = GAME_BALANCE.monsters.attackGrowthPerTier;
export const MONSTER_DEFENCE_GROWTH = GAME_BALANCE.monsters.defenseGrowthPerTier;
export const BUILDING_LEVELLING_MULTIPLIER = GAME_BALANCE.buildings.costMultiplier;
export const RARITY_MULTIPLIERS = GAME_BALANCE.equipment.rarityMultipliers;
export const MAX_BARS_PER_SECOND = GAME_BALANCE.training.maxBarsPerSecond;
