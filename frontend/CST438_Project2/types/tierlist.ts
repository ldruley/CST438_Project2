export interface User {
    id: number;
    username: string;
    email?: string;
    isAdmin?: boolean;
}

export interface Item {
    id: number;
    name: string;
    rank: number;
    tier?: {
        id: number;
    };
}

export interface Tier {
    id: number;
    name: string;
    color: string;
    description?: string;
    user?: User;
    items?: Item[];
    isPublic?: boolean;
}

export interface Tierlist {
    id: number;
    name: string;
    description?: string;
    user?: User;
    isPublic?: boolean;
    tiers?: Tier[];
}