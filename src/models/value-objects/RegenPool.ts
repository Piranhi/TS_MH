export interface poolChangedPayload {
	current: number;
	allocated: number;
	max: number;
	effective: number;
}

export class RegenPool {
	/** The hard ceiling that can never be exceeded */
	private _max: number;

	/** How much is currently spendable (may be fractional) */
	private _current = 0;

	/** How many whole points are locked in other systems */
	private _allocated = 0;

	/** Rate at which stamina re‑fills (points per second, can be fractional) */
	private readonly regenRate: number;

	constructor(max: number, regenPerSecond: number, startFull: boolean) {
		this._max = max;
		this.regenRate = regenPerSecond;
		if (startFull) this._current = max; // start full
	}

	/* ─────────────── getters ─────────────── */

	/** Spendable pool, read‑only outside */
	get current(): number {
		return this._current;
	}

	/** Whole points that are locked away */
	get allocated(): number {
		return this._allocated;
	}

	get max(): number {
		return this._max;
	}

	/** Dynamic cap = max − allocated */
	get effective(): number {
		return this._max - this._allocated;
	}

	/* ─────────────── API ─────────────── */

	/** Try to spend N whole points. Returns true if it succeeded. */
	spend(points: number): boolean {
		if (!Number.isInteger(points) || points <= 0) return false;
		if (this._current < points) return false;

		this._current -= points;
		this._allocated += points;
		return true;
	}

	/** Refund N whole points that were previously spent. */
	refund(points: number): boolean {
		if (!Number.isInteger(points) || points <= 0) return false;
		if (this._allocated < points) return false;

		this._allocated -= points;
		// Current may be fractional, but must never exceed max
		this._current = Math.min(this._current + points, this._max);
		return true;
	}

	setMax(newMax: number) {
		this._max = newMax;
	}

	public destroy() {
		this._allocated = 0;
		this._current = 0;
	}

	/** Regenerate over a frame (dt in **seconds**, may be fractional) */
	regen(dt: number): void {
		if (dt <= 0) return;
		this._current = Math.min(this._current + dt * this.regenRate, this.effective);
	}

	toJSON() {
		return {
			__type: "RegenPool",
			max: this._max,
			regenRate: this.regenRate,
			current: this.current,
			allocated: this._allocated,
		};
	}

	/** Rebuilds a fresh instance from that JSON blob */
	static fromJSON(raw: any): RegenPool {
		const p = new RegenPool(raw.max, raw.regenRate, false);
		p._current = raw.current;
		p._allocated = raw.allocated;
		return p;
	}
}
