import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchFlights } from '../utils/fetch/flights';
import { fetchSession } from '../utils/fetch/sessions';
import type { Flight } from '../types/flight';
import Navbar from '../components/Navbar';
import Toolbar from '../components/tools/Toolbar';
import DepartureTable from '../components/tables/DepartureTable';

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
	const [flights, setFlights] = useState<Flight[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!sessionId) return;
		setLoading(true);
		fetchSession(sessionId)
			.then((data) => setSession(data))
			.catch((error) => console.error('Error fetching session:', error));
		fetchFlights(sessionId)
			.then((data) => setFlights(data))
			.finally(() => setLoading(false));
	}, [sessionId]);

	return (
		<div className="min-h-screen bg-black text-white">
			<Navbar sessionId={sessionId} accessId={accessId} />
			<div className="pt-16">
				<Toolbar
					icao={session ? session.airportIcao : ''}
					sessionId={sessionId}
					accessId={accessId}
				/>
				<div className="-mt-4">
					{loading ? (
						<div className="text-center py-12 text-gray-400">
							Loading departures...
						</div>
					) : (
						<DepartureTable flights={flights} />
					)}
				</div>
			</div>
		</div>
	);
}
