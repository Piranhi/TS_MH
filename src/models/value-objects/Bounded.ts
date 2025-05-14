export class Bounded {
	private _current: number;

	constructor(public min: number, public max: number, current: number) {
		this._current = this.clamp(current);
	}

	public get current(): number {
		return this._current;
	}

	public set current(v: number) {
		this._current = this.clamp(v);
	}

	public get percent(): number {
		return this._current > 0 ? this._current / this.max : 0;
	}

	public setToMax(): void {
		this.current = this.max;
	}

	public adjust(delta: number): void {
		this.current += delta;
	}

	public increase(amount: number): void {
		this.current += amount;
	}

	public decrease(amount: number): void {
		this.current -= amount;
	}

	public isEmpty(): boolean {
		return this.current <= this.min;
	}

	public isFull(): boolean {
		return this.current >= this.max;
	}

	public getRounded(): number {
		return Math.floor(this.current);
	}

	private clamp(value: number): number {
		return Math.floor(Math.max(this.min, Math.min(value, this.max)));
	}

	toJSON() {
		return { __type: "Bounded", min: this.min, max: this.max, current: this.current };
	}

	static fromJSON(raw: any): Bounded {
		return new Bounded(raw.min, raw.max, raw.current);
	}
}
