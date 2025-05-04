import { EnemyCharacter } from "./Characters/EnemyCharacter";

export class Area {


    static createAreaFromId(areaId: string): Area{
        console.log("TODO - Creating area " + areaId);
        const area = new Area();
        return area;
    }

}


export function pickEnemy(area: Area): EnemyCharacter {
    const enemyName: string = Math.random() < 0.5? "Simon" : "Nick";
    return EnemyCharacter.createNewEnemy(enemyName);
}


