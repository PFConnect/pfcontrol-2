// src/types/session.ts
export type Position = 'POSITION' | 'DEL' | 'GND' | 'TWR' | 'APP';

export interface SessionInfo {
    sessionId: string;
    accessId: string;
    airportIcao: string;
    createdAt: string;
    createdBy: string;
    isPFATC: boolean;
    activeRunway?: string;
    customName?: string;
    isLegacy: boolean;
    flightCount: number;
}

export interface SessionUser {
	id: string;
	username: string;
	avatar: string | null;
	joinedAt: number;
	position: Position;
}
