export class Bounded{
    constructor(
        public min: number,
        public max: number,
        current: number
    ){
        this.current = current;
    }

    private _current!:number;

    public get current(): number{
        return this._current;
    }

    public set current(v: number){
        this._current = Math.min(Math.max(v, this.min), this.max);
    }

    public adjust(delta: number): void{
        this.current += delta;
    }


}