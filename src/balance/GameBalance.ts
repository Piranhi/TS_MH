// src/balance/GameBalance.ts
// ===================================================
// Centralized Game Balance Configuration
// Single source of truth for all scaling values
// ===================================================

import { printLog } from "@/core/DebugManager";
import { ITEM_RARITIES, ItemRarity, TraitRarity } from "@/shared/types";

export const GAME_BALANCE = {
	// === OFFLINE SCALING ===
	offline: {
		offlineThreshold_MS: 30 * 60 * 1000, // 30 min hidden → count as offline
		startupStaleTime_MS: 2 * 60 * 1000, // If last save is older than this on boot
		defaultOfflineEfficiency: 0.8, // 80 % of normal rewards while idle

		chestIntervalsSec: [
			30 * 60, // 30 m
			60 * 60, // 1 h
			2 * 60 * 60,
			4 * 60 * 60,
			8 * 60 * 60, // Cap – repeats every 8 h afterwards
		],

		Default_Next_Chest_Sec: 30 * 60, // UI fallback when none earned

		// ─ Hunt calculations
		estimatedKillTimeSec: 30, // Simple average kill-time placeholder
		minKillTimeSec: 5, // Safety floor
		maxKillTimeSec: 300, // Safety ceiling

		// ─ Hunt-to-Renown scaling
		renownPerKillFactor: 1,

		// Blacksmith calculations
		blacksmithChunkTime: 600, // 10 minutes
	},

	// === MONSTER SCALING ===
	monsters: {
		hpGrowthPerTier: 3.0, // Was 1.75
		attackGrowthPerTier: 2.5, // Was 1.45
		defenseGrowthPerTier: 2.2, // Was 1.4

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
		baseAbilityCD: 1,

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

                healing: {
                        passiveHealAmount: 1,
                        recoveryStateHeal: 0.01,
                },

                stamina: {
                        baseMax: 100,
                        regenPerSecond: 5,
                        enemyMax: 100,
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

	// === SETTLEMENT  SCALING ===

	settlement: {
		baseBuildPointsPerPrestige: 10,
	},

	// === BUILDING SCALING ===
	buildings: {
		// Buildings max level
		maxlevel: 6,
		// Cost multiplier per level (from levelling-types.ts)
		costMultiplier: 2.25,
	},

	// === BLACKSMITH SCALING ===
	blacksmith: {
		// Default raw ore craft time at base level
		defaultRawOreCraftTime: 1,
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
		// Level up cost scaling multiplier for trained stats
		levelUpCostMultiplier: 1.5,
	},

	// === CLASS SYSTEM ===
	classes: {
		pointsPerLevel: 1,
	},

	// === PRESTIGE SCALING ===
	prestige: {
		// Permanent bonus percentages (from Player.ts)
		permanentBonusRate: 0.02, // 2% of stats become permanent

		// Energy growth per prestige
		energyPerPrestige: 2,
		energyRegenPerPrestige: 0.1,

		// Meta progression scaling
		metaPointsPerLevel: 10,

		// Prestige requirements
		minimumLevelToPrestige: 10,

		// Expected prestige frequency (for balance)
		targetPrestigeHours: 2, // How many hours per prestige cycle
	},

	// === OUTPOSTS SCALING ===

	outpost: {
		bossKillsNeededForUnlock: 10,
		bossKillsNeededForSkip: 10,
		outpostBuildCost: 100,
		outpostBuildScaler: 1.5, // Each outpost costs 50% more than the last
		outpostMaxLevel: 10, // Maximum level for outposts
	},

	// === RESEARCH SCALING ===
	research: {
		// Research unlock costs
		baseResearchSpeedMultiplier: 1,
		baseCostMultiplier: 1.5, // Each tier costs 50% more
		timeToUnlockHours: [0.5, 1, 2, 4, 8], // Expected unlock times

		// Research power scaling
		powerBonusPerNode: 0.05, // 5% bonus per research node
		maxResearchMultiplier: 2.0, // Cap total research bonus

		// Prerequisites validation
		maxPrerequisiteDepth: 5, // Prevent overly deep trees

		data: {},
	},

	// === DROP SCALING ===
	loot: {
		// Base drop chances that scale with area tier
		baseDropChance: 0.01,
		dropDecayFactor: 0.9, // Drops get rarer in higher tiers
		// Minimum drop chance
		rarityChances: [
			["unique", 1],
			["legendary", 50],
			["epic", 150],
			["rare", 300],
			["uncommon", 500],
			["common", 10000],
		] as [(typeof ITEM_RARITIES)[number], number][],
	},

	// === TRAIT RARITIES ===
	traits: {
		rarityChances: [
			["epic", 10],
			["rare", 50],
			["uncommon", 1500],
			["common", 10000],
		] as [TraitRarity, number][],
	},

	// === HUNT BALANCE ===
	hunt: {
		baseSearchTime: 1, // Base time between encounter rolls in seconds
		baseEncounterChance: 0.5, // Base chance to encounter a monster per search
		enemiesNeededForBoss: 10, // How many enemies to defeat for a boss encounter
	},

	// === MODIFIER SYSTEM CONFIG ===
	//
	// The modifier engine applies bonuses through a fixed sequence of layers.
	// Each layer is either additive or multiplicative. Every system shares
	// this order so balance adjustments only need to be done in one place.
	// Systems may simply not use some layers, leaving them empty.
	modifiers: {
		layers: [
			{ name: "building", op: "mul" },
			{ name: "equipment", op: "mul" },
			{ name: "run", op: "mul" },
			{ name: "permanent", op: "mul" },
			{ name: "prestige", op: "mul" },
			{ name: "challenge", op: "mul" },
		],
		systems: {
			researchSpeed: { base: 1 },
			blacksmithSpeed: { base: 1 },
			trainingSpeed: { base: 1 },
		},
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
		// Renown increases 5x per tier, then scaled by rarity
		// TODO - Hook in library upgrades.
		return Math.floor(Math.pow(5, baseTier - 1) * rarityMultiplier);
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

	// === LOOT CALCULATIONS ===
	getItemRarity(): ItemRarity {
		const chance = Math.random() * 10000;
		printLog("Creating Item - Rarity Chance: " + chance, 4, "types.ts");
		for (const [rarity, max] of GAME_BALANCE.loot.rarityChances) {
			if (chance <= max) return rarity;
		}
		// Fallback if none match (shouldn't happen)
		return "common";
	},

	getTraitRarity(): TraitRarity {
		const chance = Math.random() * 10000;
		for (const [rarity, max] of GAME_BALANCE.traits.rarityChances) {
			if (chance <= max) return rarity;
		}
		return "common";
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
		// Each level requires 10x more build points than the base cost
		// e.g. Level 1 -> 10 * baseCost, Level 2 -> 20 * baseCost
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

	// === PRESTIGE CALCULATIONS ===

	/**
	 * Calculate prestige bonuses from current stats
	 */
	calculatePrestigeBonuses(currentStats: { attack: number; defence: number; hp: number }) {
		const rate = GAME_BALANCE.prestige.permanentBonusRate;
		return {
			permanentAttack: Math.floor(currentStats.attack * rate),
			permanentDefence: Math.floor(currentStats.defence * rate),
			permanentHP: Math.floor(currentStats.hp * rate),
		};
	},

	/**
	 * Calculate total power after N prestiges
	 */
	getPrestigePowerMultiplier(prestigeCount: number): number {
		// Compound growth: each prestige adds 2% which compounds
		return Math.pow(1 + GAME_BALANCE.prestige.permanentBonusRate, prestigeCount);
	},

	/**
	 * Calculate meta points earned from a run
	 */
	getMetaPointsFromRun(finalLevel: number): number {
		return finalLevel * GAME_BALANCE.prestige.metaPointsPerLevel;
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

	/**
	 * Validate prestige progression and power scaling
	 */
	validatePrestigeBalance() {
		console.log("=== PRESTIGE BALANCE VALIDATION ===");

		let issues: string[] = [];

		// Test prestige power growth
		console.log("\n--- Prestige Power Multipliers ---");
		[1, 3, 5, 10, 20].forEach((prestiges) => {
			const multiplier = BalanceCalculators.getPrestigePowerMultiplier(prestiges);
			console.log(`${prestiges} prestiges: ${multiplier.toFixed(2)}x power`);

			// Check if growth is too fast/slow
			if (prestiges >= 5 && multiplier > 5) {
				issues.push(`${prestiges} prestiges gives ${multiplier.toFixed(1)}x power - might be too strong`);
			}
			if (prestiges >= 3 && multiplier < 1.2) {
				issues.push(`${prestiges} prestiges gives only ${multiplier.toFixed(2)}x power - might be too weak`);
			}
		});

		// Test progression time
		console.log("\n--- Prestige Timing Validation ---");
		const targetHours = GAME_BALANCE.prestige.targetPrestigeHours;
		const minLevel = GAME_BALANCE.prestige.minimumLevelToPrestige;
		console.log(`Target: ${targetHours}h per prestige, min level ${minLevel}`);

		// You could add actual timing calculations here based on XP rates

		if (issues.length === 0) {
			console.log("✅ Prestige balance looks good!");
		} else {
			console.log("⚠️ Prestige balance issues:");
			issues.forEach((issue) => console.log(`  - ${issue}`));
		}
	},

	/**
	 * Full balance health check
	 */
	runFullBalanceCheck() {
		this.validateBalance();
		this.validatePrestigeBalance();
		console.log("\n=== BALANCE SUMMARY ===");
		console.log("Run this regularly during development to catch balance issues early!");
	},
};

// Export individual constants for backwards compatibility during migration
export const MONSTER_HP_GROWTH = GAME_BALANCE.monsters.hpGrowthPerTier;
export const MONSTER_ATTACK_GROWTH = GAME_BALANCE.monsters.attackGrowthPerTier;
export const MONSTER_DEFENCE_GROWTH = GAME_BALANCE.monsters.defenseGrowthPerTier;
export const BUILDING_LEVELLING_MULTIPLIER = GAME_BALANCE.buildings.costMultiplier;
export const RARITY_MULTIPLIERS = GAME_BALANCE.equipment.rarityMultipliers;
