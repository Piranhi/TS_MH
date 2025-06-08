import { GameBase } from "./GameBase";

interface DestroyableInterface {
    destroy(): void;
}

export abstract class Destroyable extends GameBase implements DestroyableInterface {
    protected destroyed = false;

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.cleanUp();
    }
}
