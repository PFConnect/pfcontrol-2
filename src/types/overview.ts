import type { Flight } from './flight';

export interface Controller {
    username: string;
    role: string;
    avatar?: string | null;
    hasVatsimRating?: boolean;
    isEventController?: boolean;
}

export interface OverviewSession {
    sessionId: string;
    airportIcao: string;
    activeRunway?: string;
    createdAt: string;
    createdBy: string;
    isPFATC: boolean;
    activeUsers: number;
    flights: Flight[];
    flightCount: number;
    controllers?: Controller[];
}

export interface OverviewData {
    activeSessions: OverviewSession[];
    totalActiveSessions: number;
    totalFlights: number;
    arrivalsByAirport: Record<string, (Flight & { sessionId: string; departureAirport: string })[]>;
    lastUpdated: string;
}