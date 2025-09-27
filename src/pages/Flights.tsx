import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toolbar from '../components/tools/Toolbar';

interface SessionData {
	sessionId: string;
	airportIcao: string;
	activeRunway?: string;
	atis?: unknown;
}

export default function Flights() {
	const { sessionId } = useParams<{ sessionId?: string }>();
	const [searchParams] = useSearchParams();
	const accessId = searchParams.get('accessId') ?? undefined;

	const [session, setSession] = useState<SessionData | null>(null);

	useEffect(() => {
		if (!sessionId) return;
		fetch(`${import.meta.env.VITE_SERVER_URL}/api/sessions/${sessionId}`)
			.then((res) => (res.ok ? res.json() : Promise.reject(res)))
			.then((data) => setSession(data));
	}, [sessionId]);

	return (
		<div className="min-h-screen bg-black text-white">
			<Navbar sessionId={sessionId} accessId={accessId} />

			<div className="pt-16">
				<Toolbar icao={session ? session.airportIcao : ''} />
			</div>
		</div>
	);
}
