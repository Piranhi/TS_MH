export type ScreenName = 'settlement'| 'character' | 'hunt' | 'inventory' | 'research' | 'train' | 'blacksmith';

export type Resource = {
    name: string;
    current: number;
    max: number
}

export interface StatRange {
    min:        number;
    max:        number;
    current:    number;
}


