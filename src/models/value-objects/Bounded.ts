
/* ─────────── BoundedNumber ─────────── */

export class BoundedNumber {
    private _current: number;

    constructor(public min: number, public max: number, current: number) {
        if (min > max) throw new Error("min cannot exceed max");
        this._current = this.clamp(current);
    }

    /* ——— accessors ——— */
    get current(): number {
        return this._current;
    }
    set current(v: number) {
        this._current = this.clamp(v);
    }
    get percent(): number {
        return this.max === 0 ? 0 : this._current / this.max;
    }

    /* ——— mutators ——— */
    setToMax() {
        this.current = this.max;
    }
    setToMin() {
        this.current = this.min;
    }
    adjust(delta: number) {
        this.current = this.current + delta;
    }
    increase(amount: number) {
        this.adjust(amount);
    }
    decrease(amount: number) {
        this.adjust(-amount);
    }

    /* ——— queries ——— */
    isEmpty(): boolean {
        return this.current <= this.min;
    }
    isFull(): boolean {
        return this.current >= this.max;
    }
    getRounded(): number {
        return Math.floor(this.current);
    }

    /* ——— helpers ——— */
    private clamp(value: number): number {
        return Math.max(this.min, Math.min(value, this.max));
    }

    /* ——— serialisation ——— */
    toJSON() {
        return { __type: "BoundedNumber", min: this.min, max: this.max, current: this.current };
    }
    static fromJSON(raw: any): BoundedNumber {
        return new BoundedNumber(raw.min, raw.max, raw.current);
    }
}
