import type { Airport, AirportFrequency } from '../../types/airports';
import type { Aircraft } from '../../types/aircraft';

interface AvailableImage {
    filename: string;
    path: string;
    extension: string;
}

async function fetchData<T>(endpoint: string): Promise<T[]> {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_SERVER_URL}/api/data/${endpoint}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
    }
}

export function fetchAirports(): Promise<Airport[]> {
    return fetchData<Airport>('airports');
}

export function fetchAircrafts(): Promise<Aircraft[]> {
    return fetchData<Aircraft>('aircrafts');
}

export function fetchFrequencies(): Promise<AirportFrequency[]> {
    return fetchData<AirportFrequency>('frequencies');
}

export function fetchRunways(icao: string): Promise<string[]> {
    return fetchData<string>(`airports/${icao}/runways`);
}

export function fetchSids(icao: string): Promise<string[]> {
    return fetchData<string>(`airports/${icao}/sids`);
}

export function fetchStars(icao: string): Promise<string[]> {
    return fetchData<string>(`airports/${icao}/stars`);
}

export function fetchBackgrounds(): Promise<AvailableImage[]> {
    return fetchData<AvailableImage>('backgrounds');
}

export function fetchStatistics(): Promise<string[]> {
    return fetchData<string>('statistics');
}