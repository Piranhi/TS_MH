import { Bounded } from "../domain/value-objects/Bounded";
import { CharacterStatsMap } from "../types/character";
import { CharacterData } from "../types/character";



export abstract class BaseCharacter{
    private health: Bounded = new Bounded(0, 100, 100);
    constructor(protected data: CharacterData){
        this.data = data;
    }


    static createNew<T extends BaseCharacter>(this: new(data: CharacterData) => T, data: CharacterData): T{
        return new this(data);
    }

    public getHealth(): Bounded{
        return this.health;
    }

    public heal(amount: number):void{

    }

    public getName(): string{
        return this.data.name;
    }
}
