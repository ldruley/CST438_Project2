export interface User {
    id: number;
    username: string;
    email?: string;
    isAdmin?: boolean;
}

export interface Item {
    id: number;
    name: string;
    rank: number; // 1-7 corresponding to tiers S+, S, A, B, C, D, F
    tier?: {
        id: number;
    };
}

export interface Tier {
    id: number; // 1-7 for our standard tiers
    name: string; // S+, S, A, B, C, D, F
    color: string;
    description?: string;
    createdDate?: string; // ISO date string from backend
}

export interface Tierlist {
    id: number;
    name: string;
    description?: string;
    user?: User;
    isPublic?: boolean;
    items?: Item[];
    createdDate?: string; // ISO date string from backend
}

// Used for mapping numeric ranks to tier names
export const TIER_RANKS = {
    1: 'S+',
    2: 'S',
    3: 'A',
    4: 'B',
    5: 'C',
    6: 'D',
    7: 'F'
};

// Used for mapping tier names to numeric ranks
export const TIER_NAMES = {
    'S+': 1,
    'S': 2,
    'A': 3,
    'B': 4,
    'C': 5,
    'D': 6,
    'F': 7
};

// Standard tier colors
export const TIER_COLORS = {
    'S+': '#FF5252', // Red
    'S': '#FF9800', // Orange
    'A': '#FFEB3B',  // Yellow
    'B': '#8BC34A', // Green
    'C': '#03A9F4',  // Blue
    'D': '#673AB7', // Purple
    'F': '#9C27B0'  // Pink
};