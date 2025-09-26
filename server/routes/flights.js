import express from 'express';
import { getFlightsBySession, addFlight, updateFlight, deleteFlight } from '../db/flights.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Get all flights for a session
router.get('/:sessionId', verifyToken, async (req, res) => {
    try {
        const flights = await getFlightsBySession(req.params.sessionId);
        res.json(flights);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch flights' });
    }
});

// Add a flight to a session
router.post('/:sessionId', verifyToken, async (req, res) => {
    try {
        const flight = await addFlight(req.params.sessionId, req.body);
        res.status(201).json(flight);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add flight' });
    }
});

// Update a flight
router.put('/:flightId', verifyToken, async (req, res) => {
    try {
        const flight = await updateFlight(req.params.flightId, req.body);
        res.json(flight);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update flight' });
    }
});

// Delete a flight
router.delete('/:flightId', verifyToken, async (req, res) => {
    try {
        await deleteFlight(req.params.flightId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete flight' });
    }
});

export default router;