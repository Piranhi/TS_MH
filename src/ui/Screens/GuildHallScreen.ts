import { BaseScreen } from "./BaseScreen";
import Markup from "./guildhall.html?raw";
import { bindEvent } from "@/shared/utils/busUtils";
import { BalanceCalculators } from "@/balance/GameBalance";
import { formatTimeFull } from "@/shared/utils/stringUtils";
import { BuildingStatus } from "../components/BuildingStatus";
import { UIButton } from "../components/UIButton";

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
		this.challengeGrid = root.querySelector("#gh-challenge-grid") as HTMLElement;
		this.activeChallengeEl = root.querySelector("#gh-active-challenge") as HTMLElement;

		CHALLENGES.forEach((c) => this.challengeLevels.set(c.id, 0));

		this.setupTickingFeature("feature.guildhall", () => {
			this.buildChallenges();
			this.buildPrestigeInfo();
			bindEvent(this.eventBindings, "settlement:changed", () => this.buildPrestigeInfo());
		});
	}

	protected onShow() {}
	protected onHide() {}

	protected handleTick(dt: number) {
		if (!this.isFeatureActive()) return;

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

	private buildPrestigeInfo() {
		const prestigeContainer = this.byId("gh-prestige-info");
		prestigeContainer.innerHTML = "";

		const title = document.createElement("h2");
		title.textContent = "Prestige Rewards";

		const prestigeRewardList = document.createElement("ul");
		prestigeRewardList.className = "basic-list";

		//<ul id="gh-prestige-list" class="basic-list"></ul>;

		prestigeContainer.appendChild(title);
		prestigeContainer.appendChild(prestigeRewardList);

		this.updatePrestigeInfo(prestigeRewardList);
	}

	private updatePrestigeInfo(prestigeRewardList: HTMLUListElement) {
		const char = this.context.character;
		const stats = char.statsEngine.getAll();
		const bonuses = BalanceCalculators.calculatePrestigeBonuses({
			attack: stats.attack,
			defence: stats.defence,
			hp: char.maxHp,
		});
		const buildPoints = this.context.settlement.getBuildPointsFromPrestige();
		const meta = BalanceCalculators.getMetaPointsFromRun(char.level);
		prestigeRewardList.innerHTML = `
            <li class="basic-text-light">+${bonuses.permanentAttack} permanent Attack</li>
            <li class="basic-text-light">+${bonuses.permanentDefence} permanent Defence</li>
            <li class="basic-text-light">+${bonuses.permanentHP} permanent HP</li>
            <li class="basic-text-light">+${buildPoints} build points</li>
            <li class="basic-text-light">+${meta} meta points</li>`;
	}

	private buildChallenges() {
		this.challengeGrid.innerHTML = "";
		CHALLENGES.forEach((ch) => {
			const level = this.challengeLevels.get(ch.id) || 0;
			const card = document.createElement("div");
			card.className = "basic-grid-card";
			if (this.activeChallenge === ch.id) card.classList.add("active");
			const title = document.createElement("div");
			title.className = "basic-subtitle";
			title.textContent = `${ch.name} (Lv ${level})`;
			card.appendChild(title);
			const desc = document.createElement("div");
			desc.className = "basic-text-light";
			desc.textContent = ch.description.replace("{target}", String(ch.targetAreas[level]));
			card.appendChild(desc);
			const prog = document.createElement("div");
			prog.className = "basic-text-footer";
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
