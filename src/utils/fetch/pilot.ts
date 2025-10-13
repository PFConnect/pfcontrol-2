import type { PilotProfile } from '../../types/pilot';

export async function fetchPilotProfile(username: string): Promise<PilotProfile | null> {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_SERVER_URL}/api/logbook/pilot/${username}`
        );
        if (res.ok) {
            return await res.json();
        } else {
            return null;
        }
    } catch {
        return null;
    }
}

export async function shareFlight(flightid: string): Promise<string> {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_SERVER_URL}/api/logbook/flights/${flightid}/share`,
            {
                method: 'POST',
                credentials: 'include',
            }
        );
        if (!res.ok) return '';
        const data = await res.json();
        if (data.shareToken) return `/flight/${data.shareToken}`;
        if (data.shareUrl) {
            try {
                const u = new URL(data.shareUrl);
                return u.pathname || data.shareUrl;
            } catch {
                return data.shareUrl;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return '';
}