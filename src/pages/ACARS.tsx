import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Loader from '../components/common/Loader';
import { createFlightsSocket } from '../sockets/flightsSocket';

export default function ACARS() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<{ id: string; flightId?: string | number; text: string; ts: string }[]>([]);
    const [socketWrapper, setSocketWrapper] = useState<any>(null);

    useEffect(() => {
        if (!sessionId) return;
        setLoading(true);
        // connect without accessId (viewer)
        const socket = createFlightsSocket(sessionId, undefined,
            // onFlightUpdated - ignore here
            () => {},
            // onFlightAdded - ignore
            () => {},
            () => {},
            () => {}
        );
        setSocketWrapper(socket);

        const handlePdc = (payload: any) => {
            try {
                const ptext = payload?.pdcText ?? (payload?.updatedFlight?.pdc_remarks ?? (payload?.updatedFlight?.pdc_text ?? ''));
                const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
                if (ptext) {
                    setMessages((m) => [{ id, flightId: payload.flightId, text: String(ptext), ts: new Date().toISOString() }, ...m]);
                }
            } catch (e) { console.debug('ACARS pdc handler error', e); }
        };

        socket.socket.on('pdcIssued', handlePdc);
        socket.socket.on('connect', () => setLoading(false));
        socket.socket.on('connect_error', () => setLoading(false));

        return () => {
            try {
                socket.socket.off('pdcIssued', handlePdc);
                socket.socket.disconnect();
            } catch (e) {}
        };
    }, [sessionId]);

    if (!sessionId) return <div className="min-h-screen"><Navbar /><div className="p-8">Missing session</div></div>;
    if (loading) return (<div className="min-h-screen"><Navbar /><div className="p-8"><Loader /></div></div>);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <h1 className="text-2xl font-bold mb-4">ACARS / PDC Inbox</h1>
                {messages.length === 0 ? (
                    <div className="text-gray-400">No PDCs yet.</div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((m) => (
                            <div key={m.id} className="p-4 bg-gray-900/40 border border-gray-800 rounded-md">
                                <div className="text-xs text-gray-400">Received: {new Date(m.ts).toLocaleString()}</div>
                                {m.flightId && <div className="text-xs text-gray-400">Flight ID: {m.flightId}</div>}
                                <pre className="mt-2 text-sm font-mono whitespace-pre-wrap">{m.text}</pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}