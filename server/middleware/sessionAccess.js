import pool from '../db/connections/connection.js';

export async function validateSessionAccess(sessionId, accessId) {
    if (!sessionId || !accessId) return false;
    const result = await pool.query(
        'SELECT 1 FROM sessions WHERE session_id = $1 AND access_id = $2',
        [sessionId, accessId]
    );
    return result.rowCount > 0;
}