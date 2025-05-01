export interface Screen{
    element: HTMLElement;

    /** Called once, when the element is first inserted into #game-area */
    init(): void;

    /** Called every time you switch *to* this screen */
    show(): void;

    /** Called every time you switch *away* from this screen */
    hide(): void;

      /** Optional per-frame or interval updates */
    update?(deltaMs: number): void
}