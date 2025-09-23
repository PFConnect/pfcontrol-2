export interface User {
    userId: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    isAdmin: boolean;
}

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export async function getCurrentUser(): Promise<User | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include',
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

export async function logout(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        return response.ok;
    } catch (error) {
        console.error('Error logging out:', error);
        return false;
    }
}

export function getDiscordLoginUrl(): string {
    return `${API_BASE_URL}/api/auth/discord`;
}