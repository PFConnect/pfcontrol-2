import express from 'express';
import pool from '../db/connection.js';
import { encrypt, decrypt } from '../tools/encryption.js';
import { generateSessionId, generateAccessId } from '../tools/ids.js';

const router = express.Router();

async function initializeDatabase() {
    try {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'sessions'
            )
        `);
        const exists = result.rows[0].exists;
        if (!exists) {
            await pool.query(`
                CREATE TABLE sessions (
                    session_id VARCHAR(8) PRIMARY KEY,
                    access_id VARCHAR(64) UNIQUE NOT NULL,
                    active_runway VARCHAR(10),
                    airport_icao VARCHAR(4) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    created_by VARCHAR(20) NOT NULL,
                    is_pfatc BOOLEAN DEFAULT false,
                    flight_strips TEXT,
                    atis TEXT
                )
            `);
            console.log('\x1b[34m%s\x1b[0m', 'Sessions table created');
        } else {
            console.log('\x1b[33m%s\x1b[0m', 'Sessions table already exists');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}
initializeDatabase();

// Create new session
router.post('/create', async (req, res) => {
    try {
        const {
            airportIcao,
            createdBy,
            isPFATC = false,
            activeRunway = null
        } = req.body;

        if (!airportIcao || !createdBy) {
            return res.status(400).json({
                error: 'Airport ICAO and creator ID are required'
            });
        }

        const sessionId = generateSessionId();
        const accessId = generateAccessId();

        const existingSession = await pool.query(
            'SELECT session_id FROM sessions WHERE session_id = $1',
            [sessionId]
        );

        if (existingSession.rows.length > 0) {
            return router.post('/create')(req, res);
        }

        const encryptedFlightStrips = encrypt([]);
        const encryptedAtis = encrypt({
            letter: 'A',
            text: '',
            timestamp: new Date().toISOString()
        });

        await pool.query(`
            INSERT INTO sessions (
                session_id, access_id, active_runway, airport_icao,
                created_by, is_pfatc, flight_strips, atis
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            sessionId,
            accessId,
            activeRunway,
            airportIcao.toUpperCase(),
            createdBy,
            isPFATC,
            JSON.stringify(encryptedFlightStrips),
            JSON.stringify(encryptedAtis)
        ]);

        res.status(201).json({
            sessionId,
            accessId,
            activeRunway,
            airportIcao: airportIcao.toUpperCase(),
            createdBy,
            isPFATC,
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create session'
        });
    }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await pool.query(
            'SELECT * FROM sessions WHERE session_id = $1',
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const session = result.rows[0];

        const flightStrips = decrypt(JSON.parse(session.flight_strips));
        const atis = decrypt(JSON.parse(session.atis));

        res.json({
            sessionId: session.session_id,
            accessId: session.access_id,
            activeRunway: session.active_runway,
            airportIcao: session.airport_icao,
            createdAt: session.created_at,
            createdBy: session.created_by,
            isPFATC: session.is_pfatc,
            flightStrips: flightStrips || [],
            atis: atis || { letter: 'A', text: '', timestamp: new Date().toISOString() }
        });

    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch session'
        });
    }
});

// Update session
router.put('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { activeRunway, flightStrips, atis } = req.body;

        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (activeRunway !== undefined) {
            updates.push(`active_runway = $${paramCounter++}`);
            values.push(activeRunway);
        }

        if (flightStrips !== undefined) {
            updates.push(`flight_strips = $${paramCounter++}`);
            values.push(JSON.stringify(encrypt(flightStrips)));
        }

        if (atis !== undefined) {
            updates.push(`atis = $${paramCounter++}`);
            values.push(JSON.stringify(encrypt(atis)));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(sessionId);
        const query = `UPDATE sessions SET ${updates.join(', ')} WHERE session_id = $${paramCounter} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const session = result.rows[0];
        const decryptedFlightStrips = decrypt(JSON.parse(session.flight_strips));
        const decryptedAtis = decrypt(JSON.parse(session.atis));

        res.json({
            sessionId: session.session_id,
            accessId: session.access_id,
            activeRunway: session.active_runway,
            airportIcao: session.airport_icao,
            createdAt: session.created_at,
            createdBy: session.created_by,
            isPFATC: session.is_pfatc,
            flightStrips: decryptedFlightStrips || [],
            atis: decryptedAtis || { letter: 'A', text: '', timestamp: new Date().toISOString() }
        });

    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update session'
        });
    }
});

// Delete session
router.delete('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await pool.query(
            'DELETE FROM sessions WHERE session_id = $1 RETURNING session_id',
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully', sessionId });

    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete session'
        });
    }
});

// Get all sessions (admin endpoint)
// TODO: ADMIN AUTHENTICATION
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT session_id, airport_icao, created_at, created_by, is_pfatc, active_runway FROM sessions ORDER BY created_at DESC'
        );

        res.json(result.rows.map(session => ({
            sessionId: session.session_id,
            airportIcao: session.airport_icao,
            createdAt: session.created_at,
            createdBy: session.created_by,
            isPFATC: session.is_pfatc,
            activeRunway: session.active_runway
        })));

    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch sessions'
        });
    }
});

export default router;