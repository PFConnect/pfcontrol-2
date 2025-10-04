import express from 'express';
import requireAuth from '../middleware/isAuthenticated.js';
import { requireAdmin } from '../middleware/isAdmin.js';
import {
    getDailyStatistics,
    getTotalStatistics,
    getAllUsers,
    getSystemInfo,
    getAdminSessions
} from '../db/admin.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

// GET: /api/admin/statistics - Get dashboard statistics
router.get('/statistics', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const dailyStats = await getDailyStatistics(days);
        const totalStats = await getTotalStatistics();

        res.json({
            daily: dailyStats,
            totals: totalStats
        });
    } catch (error) {
        console.error('Error fetching admin statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// GET: /api/admin/users - Get all users with pagination
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        const result = await getAllUsers(page, limit);
        res.json(result);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET: /api/admin/sessions - Get all sessions with details
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await getAdminSessions();
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// GET: /api/admin/system-info - Get system information
router.get('/system-info', async (req, res) => {
    try {
        const systemInfo = await getSystemInfo();
        res.json(systemInfo);
    } catch (error) {
        console.error('Error fetching system info:', error);
        res.status(500).json({ error: 'Failed to fetch system information' });
    }
});

export default router;