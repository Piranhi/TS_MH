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

    private clamp(value: number): number {
        return Math.max(this.min, Math.min(value, this.max));
    }
}
