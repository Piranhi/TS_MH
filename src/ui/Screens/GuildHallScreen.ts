import { BaseScreen } from "./BaseScreen";
import Markup from "./guildhall.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { BalanceCalculators } from "@/balance/GameBalance";
import { formatTimeFull } from "@/shared/utils/stringUtils";
import { BuildingStatus } from "../components/BuildingStatus";

interface ChallengeSpec {
	id: string;
	name: string;
	description: string;
	targetAreas: number[]; // area number for each level
}

const CHALLENGES: ChallengeSpec[] = [
	{
		id: "no_inventory",
		name: "No Inventory",
		description: "Reach area {target} without using inventory.",
		targetAreas: [4, 6, 8],
	},
	{
		id: "advanced_training",
		name: "Advanced Training",
		description: "Train to level 5 and reach area {target}.",
		targetAreas: [4, 6, 8],
	},
];

export class GuildHallScreen extends BaseScreen {
	readonly screenName = "guildHall";

	private runTimeEl!: HTMLElement;
	private levelEl!: HTMLElement;
	private areaEl!: HTMLElement;
	private killsEl!: HTMLElement;
	private prestigeListEl!: HTMLElement;
	private prestigeBtn!: HTMLButtonElement;
	private prestigeLockedEl!: HTMLElement;
	private challengeGrid!: HTMLElement;
	private activeChallengeEl!: HTMLElement;

	private challengeLevels = new Map<string, number>();
	private activeChallenge: string | null = null;

        init() {
                const root = this.addMarkuptoPage(Markup);
                const statusEl = root.querySelector("#gh-building-status") as HTMLElement;
                const building = this.context.settlement.getBuilding("guild_hall");
                if (building && statusEl) new BuildingStatus(statusEl, building);
                this.runTimeEl = root.querySelector("#gh-run-time") as HTMLElement;
		this.levelEl = root.querySelector("#gh-level") as HTMLElement;
		this.areaEl = root.querySelector("#gh-area") as HTMLElement;
		this.killsEl = root.querySelector("#gh-kills") as HTMLElement;
		this.prestigeListEl = root.querySelector("#gh-prestige-list") as HTMLElement;
		this.prestigeBtn = root.querySelector("#gh-prestige-btn") as HTMLButtonElement;
		this.prestigeLockedEl = root.querySelector("#gh-prestige-locked") as HTMLElement;
		this.challengeGrid = root.querySelector("#gh-challenge-grid") as HTMLElement;
		this.activeChallengeEl = root.querySelector("#gh-active-challenge") as HTMLElement;

		CHALLENGES.forEach((c) => this.challengeLevels.set(c.id, 0));
		this.buildChallenges();
		this.updatePrestigeInfo();

		bindEvent(this.eventBindings, "Game:UITick", () => this.update());
		bindEvent(this.eventBindings, "settlement:changed", () => this.updatePrestigeInfo());
	}

	show() {
		this.update();
	}
	hide() {}

	update() {
		const run = this.context.currentRun;
		if (!run) return;
		const duration = Date.now() - run.runStartTime;
		this.runTimeEl.textContent = formatTimeFull(duration);
		this.levelEl.textContent = String(this.context.character.level);
		const areaId = this.context.hunt.getActiveAreaID();
		this.areaEl.textContent = areaId || "-";
		if (areaId) {
			const stats = this.context.services.statsManager.getAreaStats(areaId);
			this.killsEl.textContent = String(stats.killsThisRun);
		}
	}

	private updatePrestigeInfo() {
		const building = this.context.settlement.getBuilding("guild_hall");
		const unlocked = building?.buildingStatus === "unlocked";
		this.prestigeBtn.disabled = !unlocked;
		this.prestigeLockedEl.hidden = unlocked;

		const char = this.context.character;
		const stats = char.statsEngine.getAll();
		const bonuses = BalanceCalculators.calculatePrestigeBonuses({
			attack: stats.attack,
			defence: stats.defence,
			hp: char.maxHp.toNumber(),
		});
		const buildPoints = this.context.settlement.getBuildPointsFromPrestige();
		const meta = BalanceCalculators.getMetaPointsFromRun(char.level);
		this.prestigeListEl.innerHTML = `
            <li>+${bonuses.permanentAttack} permanent Attack</li>
            <li>+${bonuses.permanentDefence} permanent Defence</li>
            <li>+${bonuses.permanentHP} permanent HP</li>
            <li>+${buildPoints} build points</li>
            <li>+${meta} meta points</li>`;
	}

	private buildChallenges() {
		this.challengeGrid.innerHTML = "";
		CHALLENGES.forEach((ch) => {
			const level = this.challengeLevels.get(ch.id) || 0;
			const card = document.createElement("div");
			card.className = "challenge-card";
			if (this.activeChallenge === ch.id) card.classList.add("active");
			const title = document.createElement("div");
			title.className = "challenge-title";
			title.textContent = `${ch.name} (Lv ${level})`;
			card.appendChild(title);
			const desc = document.createElement("div");
			desc.textContent = ch.description.replace("{target}", String(ch.targetAreas[level]));
			card.appendChild(desc);
			const prog = document.createElement("div");
			prog.className = "challenge-progress";
			prog.textContent = this.activeChallenge === ch.id ? "In Progress" : "";
			card.appendChild(prog);
			card.addEventListener("click", () => {
				this.activeChallenge = ch.id;
				this.buildChallenges();
			});
			this.challengeGrid.appendChild(card);
		});
		if (this.activeChallenge) {
			const level = this.challengeLevels.get(this.activeChallenge) || 0;
			const spec = CHALLENGES.find((c) => c.id === this.activeChallenge)!;
			this.activeChallengeEl.textContent = `Current: ${spec.name} (Lv ${level})`;
		} else {
			this.activeChallengeEl.textContent = "No challenge selected";
		}
	}
}
