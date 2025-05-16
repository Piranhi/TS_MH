import { BigNumber } from "../utils/BigNumber";

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

/* ─────────── BoundedBig ─────────── */

export class BoundedBig {
    private _current: BigNumber;

    constructor(public max: BigNumber, current: BigNumber, public min: BigNumber = new BigNumber(0)) {
        if (min.gt(max)) throw new Error("min cannot exceed max");
        this._current = this.clamp(current);
    }

    /* ——— accessors ——— */
    get current(): BigNumber {
        return this._current;
    }
    set current(v: BigNumber) {
        this._current = this.clamp(v);
    }
    get percent(): number {
        return this.max.eq(0) ? 0 : this._current.div(this.max).toNumber();
    }

    /* ——— mutators ——— */
    setToMax() {
        this.current = this.max;
    }
    setToMin() {
        this.current = this.min;
    }
    adjust(delta: BigNumber) {
        this.current = this.current.add(delta).clampMinZero();
    }
    increase(amount: BigNumber) {
        this.adjust(amount);
    }
    decrease(amount: BigNumber) {
        this.adjust(amount.multiply(-1));
    }

    /* ——— queries ——— */
    isEmpty(): boolean {
        return this.current.lte(this.min);
    }
    isFull(): boolean {
        return this.current.gte(this.max);
    }
    getRounded(): number {
        return Math.floor(this.current.toNumber());
    }

    /* ——— helpers ——— */
    private clamp(v: BigNumber): BigNumber {
        return BigNumber.min(BigNumber.max(v, this.min), this.max);
    }

    /* ——— serialisation ——— */
    toJSON() {
        return {
            __type: "BoundedBig",
            min: this.min.toJSON(),
            max: this.max.toJSON(),
            current: this.current.toJSON(),
        };
    }
    static fromJSON(raw: any): BoundedBig {
        return new BoundedBig(BigNumber.fromJSON(raw.min), BigNumber.fromJSON(raw.max), BigNumber.fromJSON(raw.current));
    }
}
