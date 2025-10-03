import type { Settings } from './settings';

export interface User {
    userId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    isAdmin: boolean;
    settings: Settings;
}