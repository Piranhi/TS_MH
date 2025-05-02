export interface Bounded {
    min:        number;
    max:        number;
    current:    number;
}

export namespace Bounded{

    export function clamp(b: Bounded, delta: number): void{
        b.current = Math.min(Math.max(b.current + delta, b.min), b.max)
    }

    export function initBoundedFromValue(value: number): Bounded{
        return {min: 0, current: value, max: value};
    }
}