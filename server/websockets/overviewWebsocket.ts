import { Server as SocketServer } from 'socket.io';
import { getAllSessions } from '../db/sessions.js';
import { getFlightsBySessionWithTime } from '../db/flights.js';
import { decrypt } from '../utils/encryption.js';
import { getCachedUserDataBatch } from '../utils/userDataCache.js';
import type { Server as HTTPServer } from 'http';
import type { SessionUsersServer } from './sessionUsersWebsocket.js';

let io: SocketServer;
const activeOverviewClients = new Set<string>();
let lastBroadcastData: string | null = null;
let lastBroadcastTime = 0;
const MIN_BROADCAST_INTERVAL = 500; // Minimum 500ms between broadcasts (more responsive)

export function setupOverviewWebsocket(httpServer: HTTPServer, sessionUsersIO: SessionUsersServer) {
    io = new SocketServer(httpServer, {
        path: '/sockets/overview',
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:9901', 'https://control.pfconnect.online', 'https://test.pfconnect.online'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true
    });

    io.engine.on('connection_error', (err) => {
        console.error('[Overview Socket] Engine connection error:', err);
    });

    io.on('connection', async (socket) => {
        activeOverviewClients.add(socket.id);

        try {
            const overviewData = await getOverviewData(sessionUsersIO);
            socket.emit('overviewData', overviewData);
        } catch (error) {
            console.error('[Overview Socket] Error sending initial data:', error);
            socket.emit('overviewError', { error: 'Failed to fetch overview data' });
        }

        socket.on('disconnect', () => {
            activeOverviewClients.delete(socket.id);
        });

        socket.on('error', (error) => {
            console.error('[Overview Socket] Socket error for', socket.id, ':', error);
        });
    });

    // Reduced polling interval - main updates come from events
    setInterval(async () => {
        if (activeOverviewClients.size > 0) {
            await broadcastOverviewData(sessionUsersIO);
        }
    }, 2000); // Fallback polling every 2 seconds for maximum responsiveness

    return io;
}

/**
 * Broadcast overview data with change detection and rate limiting
 */
async function broadcastOverviewData(sessionUsersIO: SessionUsersServer, force = false) {
    try {
        const now = Date.now();

        // Rate limiting - don't broadcast too frequently
        if (!force && (now - lastBroadcastTime) < MIN_BROADCAST_INTERVAL) {
            return;
        }

        const overviewData = await getOverviewData(sessionUsersIO);
        const dataString = JSON.stringify(overviewData);

        // Change detection - only broadcast if data changed
        if (!force && dataString === lastBroadcastData) {
            return;
        }

        lastBroadcastData = dataString;
        lastBroadcastTime = now;
        io.emit('overviewData', overviewData);
    } catch (error) {
        console.error('Error broadcasting overview data:', error);
    }
}

/**
 * Trigger overview update (called by other websockets when flights change)
 */
export async function triggerOverviewUpdate(sessionUsersIO: SessionUsersServer) {
    if (activeOverviewClients.size > 0) {
        await broadcastOverviewData(sessionUsersIO);
    }
}

export async function getOverviewData(sessionUsersIO: SessionUsersServer) { // Update parameter type
    try {
        // Import sector controller function
        const { getActiveSectorControllers } = await import('./sectorControllerWebsocket.js');
        const sectorControllers = await getActiveSectorControllers();

        const allSessions = await getAllSessions();
        const pfatcSessions = allSessions.filter(session => session.is_pfatc);
        const activeSessions = [];

        // Collect all user IDs upfront for batch fetching
        const allUserIds = new Set<string>();

        // First pass: collect all user IDs
        for (const session of pfatcSessions) {
            const sessionUsers = await sessionUsersIO.getActiveUsersForSession(session.session_id);
            if (sessionUsers && sessionUsers.length > 0) {
                sessionUsers.forEach(user => {
                    if (user.id) allUserIds.add(user.id);
                });
            }
        }

        // Add sector controller IDs
        sectorControllers.forEach(controller => {
            if (controller.id) allUserIds.add(controller.id);
        });

        // Batch fetch all user data at once
        const userDataMap = await getCachedUserDataBatch(Array.from(allUserIds));

        // Second pass: build session data - parallelize flight fetching
        const sessionDataPromises = pfatcSessions.map(async (session) => {
            const sessionUsers = await sessionUsersIO.getActiveUsersForSession(session.session_id);
            const isActive = sessionUsers && sessionUsers.length > 0;

            if (!isActive) return null;

            try {
                const flights = await getFlightsBySessionWithTime(session.session_id, 2);

                let atisData = null;
                if (session.atis) {
                    try {
                        const encryptedAtis = JSON.parse(session.atis);
                        atisData = decrypt(encryptedAtis);
                    } catch (err) {
                        console.error('Error decrypting ATIS:', err);
                    }
                }

                const controllers = sessionUsers.map((user) => {
                    const userData = user.id ? userDataMap.get(user.id) : null;
                    const isEventController = user.roles?.some(role => role.name === 'Event Controller') || false;

                    return {
                        username: user.username || 'Unknown',
                        role: user.position || 'APP',
                        avatar: userData?.avatarUrl || null,
                        hasVatsimRating: userData?.hasVatsimRating || false,
                        isEventController
                    };
                });

                return {
                    sessionId: session.session_id,
                    airportIcao: session.airport_icao,
                    activeRunway: session.active_runway,
                    createdAt: session.created_at,
                    createdBy: session.created_by,
                    isPFATC: session.is_pfatc,
                    activeUsers: sessionUsers.length,
                    controllers: controllers,
                    atis: atisData,
                    flights: flights || [],
                    flightCount: flights ? flights.length : 0
                };
            } catch (error) {
                console.error(`Error fetching flights for session ${session.session_id}:`, error);

                const controllers = sessionUsers.map((user) => {
                    const userData = user.id ? userDataMap.get(user.id) : null;

                    return {
                        username: user.username || 'Unknown',
                        role: user.position || 'APP',
                        avatar: userData?.avatarUrl || null,
                        hasVatsimRating: false,
                        isEventController: false
                    };
                });

                return {
                    sessionId: session.session_id,
                    airportIcao: session.airport_icao,
                    activeRunway: session.active_runway,
                    createdAt: session.created_at,
                    createdBy: session.created_by,
                    isPFATC: session.is_pfatc,
                    activeUsers: sessionUsers.length,
                    controllers: controllers,
                    atis: null,
                    flights: [],
                    flightCount: 0
                };
            }
        });

        // Wait for all sessions to load in parallel
        const sessionDataResults = await Promise.all(sessionDataPromises);
        activeSessions.push(...sessionDataResults.filter((s): s is NonNullable<typeof s> => s !== null));

        // Add sector controllers as separate "sessions"
        for (const sectorController of sectorControllers) {
            const userData = sectorController.id ? userDataMap.get(sectorController.id) : null;
            const isEventController = sectorController.roles?.some(role => role.name === 'Event Controller') || false;
            const avatar = sectorController.avatar || userData?.avatarUrl || null;

            const controllerData = {
                username: sectorController.username || 'Unknown',
                role: 'CTR',
                avatar,
                hasVatsimRating: userData?.hasVatsimRating || false,
                isEventController
            };

            activeSessions.push({
                sessionId: `sector-${sectorController.id}`,
                airportIcao: sectorController.station,
                activeRunway: null,
                createdAt: new Date(sectorController.joinedAt).toISOString(),
                createdBy: sectorController.id,
                isPFATC: true,
                activeUsers: 1,
                controllers: [controllerData],
                atis: null,
                flights: [],
                flightCount: 0
            });
        }

        type ArrivalFlight = typeof activeSessions[number]['flights'][number] & {
            sessionId: string;
            departureAirport: string;
        };
        const arrivalsByAirport: { [key: string]: ArrivalFlight[] } = {};
        activeSessions.forEach(session => {
            session.flights.forEach(flight => {
                if (flight.arrival) {
                    const arrivalIcao = flight.arrival.toUpperCase();
                    if (!arrivalsByAirport[arrivalIcao]) {
                        arrivalsByAirport[arrivalIcao] = [];
                    }
                    arrivalsByAirport[arrivalIcao].push({
                        ...flight,
                        sessionId: session.sessionId,
                        departureAirport: session.airportIcao
                    });
                }
            });
        });

        return {
            activeSessions,
            totalActiveSessions: activeSessions.length,
            totalFlights: activeSessions.reduce((sum, session) => sum + session.flightCount, 0),
            arrivalsByAirport,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error in getOverviewData:', error);
        throw error;
    }
}

export function getOverviewIO() {
    return io;
}

export function hasOverviewClients() {
    return activeOverviewClients.size > 0;
}