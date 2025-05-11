import { PlayerStatsDisplay } from "./PlayerStatsDisplay";
import { StatDisplay } from "./StatDisplay";
export class PlayerbarDisplay {
    constructor(private container: HTMLElement) {}
    private PlayerStatsEl: HTMLUListElement = document.querySelector(".player-stats")!;

    public build() {
        const playerStatList = new PlayerStatsDisplay(document.getElementById("player-statlist")!);

        const level = new StatDisplay("Level", "player:level-up", this.PlayerStatsEl, "stat-num-template", (payload, { valueEl }) => {
            valueEl.textContent = payload.toString();
        }).init();

        const stamina = new StatDisplay("Stamina", "player:stamina-changed", this.PlayerStatsEl, "stat-bar-template", (payload, { valueEl, fillEl }) => {
            const curr = Math.floor(payload.current);
            const mx = Math.floor(payload.max);
            valueEl.textContent = `${curr} / ${mx}`;
            if (fillEl) {
                const pct = mx > 0 ? (curr / mx) * 100 : 0;
                fillEl.style.setProperty("--value", String(pct));
            }
        }).init();

        const renown = new StatDisplay("Renown", "Renown:Changed", this.PlayerStatsEl, "stat-bar-template", (payload, { valueEl, fillEl }) => {
            const curr = Math.floor(payload.current);
            const mx = Math.floor(payload.max);
            valueEl.textContent = `${curr} / ${mx}`;

            if (fillEl) {
                const pct = mx > 0 ? (curr / mx) * 100 : 0;
                fillEl.style.setProperty("--value", `${pct}%`);
            }
        }).init();
    }
}
