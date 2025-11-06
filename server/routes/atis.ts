import express from 'express';
import requireAuth from '../middleware/auth.js';
import { updateSession } from '../db/sessions.js';
import { encrypt } from '../utils/encryption.js';

const router = express.Router();

interface ATISGenerateRequest {
    sessionId: string;
    ident: string;
    icao: string;
    remarks1?: string;
    remarks2?: Record<string, unknown>;
    landing_runways: string[];
    departing_runways: string[];
    metar?: string;
}

interface ExternalATISResponse {
    status: string;
    message?: string;
    data?: {
        text: string;
    };
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (fetchError) {
            clearTimeout(timeoutId);

            if (fetchError instanceof Error) {
                lastError = fetchError;

                if (attempt === maxRetries) {
                    if (fetchError.name === 'AbortError') {
                        throw new Error('ATIS generation timed out. The external service is taking too long to respond. Please try again.');
                    }
                    throw new Error(`Failed to connect to ATIS generator after ${maxRetries + 1} attempts: ${fetchError.message}`);
                }

                // Wait before retrying (exponential backoff: 1s, 2s)
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }

    throw lastError || new Error('Unknown error during fetch');
}

// POST: /api/atis/generate
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const body: ATISGenerateRequest = req.body;

        const {
            sessionId,
            ident,
            icao,
            remarks1,
            remarks2 = {},
            landing_runways,
            departing_runways,
            metar
        } = body;

        if (!sessionId || !icao || !ident) {
            return res.status(400).json({ error: 'Session ID, ICAO, and Ident are required' });
        }
        if (!Array.isArray(landing_runways) || !Array.isArray(departing_runways)) {
            return res.status(400).json({ error: 'Landing and departing runways must be arrays' });
        }

        const requestBody = {
            ident,
            icao,
            remarks1,
            remarks2,
            landing_runways,
            departing_runways,
            'output-type': 'atis',
            override_runways: false,
            metar: metar || undefined,
        };

        const response = await fetchWithRetry(
            `https://atisgenerator.com/api/v1/airports/${icao}/atis`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`External API responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json() as ExternalATISResponse;

        if (data.status !== 'success') {
            throw new Error(data.message || 'Failed to generate ATIS');
        }

        const generatedAtis = data.data?.text;
        if (!generatedAtis) {
            throw new Error('No ATIS text in response');
        }

        const atisTimestamp = new Date().toISOString();

        const atisData = {
        letter: ident,
        text: generatedAtis,
        timestamp: atisTimestamp,
        };
        
        const encryptedAtis = encrypt(atisData);
        const updatedSession = await updateSession(sessionId, { atis: JSON.stringify(encryptedAtis) });
        if (!updatedSession) {
            throw new Error('Failed to update session with ATIS data');
        }

        res.json({
            text: generatedAtis,
            letter: ident,
            timestamp: atisTimestamp,
            // Backwards compatibility: include old field names
            atisText: generatedAtis,
            ident: ident,
        });
    } catch (error) {
        console.error('Error generating ATIS:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to generate ATIS';
        res.status(500).json({ error: errorMessage });
    }
});

export default router;