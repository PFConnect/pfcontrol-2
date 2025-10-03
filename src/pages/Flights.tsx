import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchFlights } from '../utils/fetch/flights';
import { fetchSession, updateSession } from '../utils/fetch/sessions';
import { fetchBackgrounds } from '../utils/fetch/data';
import { createFlightsSocket } from '../sockets/flightsSocket';
import { useAuth } from '../hooks/auth/useAuth';
import { playSoundWithSettings } from '../utils/playSound';
import type { Flight } from '../types/flight';
import Navbar from '../components/Navbar';
import Toolbar from '../components/tools/Toolbar';
import DepartureTable from '../components/tables/DepartureTable';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

interface SessionData {
	sessionId: string;
	airportIcao: string;
	activeRunway?: string;
	atis?: unknown;
}

interface AvailableImage {
	filename: string;
	path: string;
	extension: string;
}

export default function Flights() {
	const { sessionId } = useParams<{ sessionId?: string }>();
	const [searchParams] = useSearchParams();
	const accessId = searchParams.get('accessId') ?? undefined;

	const [session, setSession] = useState<SessionData | null>(null);
	const [flights, setFlights] = useState<Flight[]>([]);
	const [loading, setLoading] = useState(true);
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const [flightsSocket, setFlightsSocket] = useState<ReturnType<
		typeof createFlightsSocket
	> | null>(null);
	const [lastSessionId, setLastSessionId] = useState<string | null>(null);
	const [availableImages, setAvailableImages] = useState<AvailableImage[]>(
		[]
	);
	const [startupSoundPlayed, setStartupSoundPlayed] = useState(false);
	const { user } = useAuth();

	useEffect(() => {
		const loadImages = async () => {
			try {
				const data = await fetchBackgrounds();
				setAvailableImages(data);
			} catch (error) {
				console.error('Error loading available images:', error);
			}
		};
		loadImages();
	}, []);

	useEffect(() => {
		if (!sessionId || sessionId === lastSessionId || initialLoadComplete)
			return;

		setLoading(true);
		setLastSessionId(sessionId);

		Promise.all([
			fetchSession(sessionId).catch((error) => {
				console.error('Error fetching session:', error);
				return null;
			}),
			fetchFlights(sessionId).catch((error) => {
				console.error('Error fetching flights:', error);
				return [];
			})
		])
			.then(([sessionData, flightsData]) => {
				if (sessionData) setSession(sessionData);
				setFlights(flightsData);
				setInitialLoadComplete(true);
				if (!startupSoundPlayed && user) {
					playSoundWithSettings(
						'startupSound',
						user.settings,
						0.7
					).catch((error) => {
						console.warn(
							'Failed to play session startup sound:',
							error
						);
					});
					setStartupSoundPlayed(true);
				}
			})
			.finally(() => {
				setLoading(false);
			});
	}, [
		sessionId,
		lastSessionId,
		initialLoadComplete,
		startupSoundPlayed,
		user
	]);

	useEffect(() => {
		if (!sessionId || !accessId || !initialLoadComplete) return;

		const socket = createFlightsSocket(
			sessionId,
			accessId,
			// onFlightUpdated
			(flight: Flight) => {
				setFlights((prev) =>
					prev.map((f) => (f.id === flight.id ? flight : f))
				);
			},
			// onFlightAdded - NEW STRIP SOUND
			(flight: Flight) => {
				setFlights((prev) => [...prev, flight]);

				// Play new strip sound when a flight is added
				if (user) {
					playSoundWithSettings(
						'newStripSound',
						user.settings,
						0.7
					).catch((error) => {
						console.warn('Failed to play new strip sound:', error);
					});
				}
			},
			// onFlightDeleted
			({ flightId }) => {
				setFlights((prev) =>
					prev.filter((flight) => flight.id !== flightId)
				);
			},
			// onFlightError
			(error) => {
				console.error('Flight websocket error:', error);
			}
		);
		socket.socket.on('sessionUpdated', (updates) => {
			setSession((prev) => (prev ? { ...prev, ...updates } : null));
		});
		setFlightsSocket(socket);
		return () => {
			socket.socket.disconnect();
		};
	}, [sessionId, accessId, initialLoadComplete, user]);

	const handleFlightUpdate = (
		flightId: string | number,
		updates: Partial<Flight>
	) => {
		if (flightsSocket) {
			flightsSocket.updateFlight(flightId, updates);
		} else {
			setFlights((prev) =>
				prev.map((flight) =>
					flight.id === flightId ? { ...flight, ...updates } : flight
				)
			);
		}
	};

	const handleFlightDelete = (flightId: string | number) => {
		if (flightsSocket) {
			flightsSocket.deleteFlight(flightId);
		} else {
			setFlights((prev) =>
				prev.filter((flight) => flight.id !== flightId)
			);
		}
	};

	const handleRunwayChange = async (selectedRunway: string) => {
		if (!sessionId) return;
		try {
			await updateSession(sessionId, { activeRunway: selectedRunway });
			setSession((prev) =>
				prev ? { ...prev, activeRunway: selectedRunway } : null
			);
			if (flightsSocket) {
				flightsSocket.updateSession({ activeRunway: selectedRunway });
			}
		} catch (error) {
			console.error('Failed to update runway:', error);
		}
	};

	// Updated background logic to respect selected image and handle random/favorites
	const selectedImage = user?.settings?.backgroundImage?.selectedImage;
	let backgroundImage = 'url("/assets/app/backgrounds/mdpc_01.png")'; // Default fallback
	if (selectedImage === 'random') {
		if (availableImages.length > 0) {
			const randomIndex = Math.floor(
				Math.random() * availableImages.length
			);
			backgroundImage = `url(${API_BASE_URL}${availableImages[randomIndex].path})`;
		}
	} else if (selectedImage === 'favorites') {
		const favorites = user?.settings?.backgroundImage?.favorites || [];
		if (favorites.length > 0) {
			const randomFav =
				favorites[Math.floor(Math.random() * favorites.length)];
			backgroundImage = `url(${API_BASE_URL}/assets/app/backgrounds/${randomFav})`;
		}
	} else if (selectedImage) {
		backgroundImage = `url(${API_BASE_URL}/assets/app/backgrounds/${selectedImage})`;
	}

	return (
		<div className="min-h-screen text-white relative">
			<div
				aria-hidden
				className="absolute inset-0 z-0"
				style={{
					backgroundImage,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
					backgroundAttachment: 'fixed',
					opacity: 0.2,
					pointerEvents: 'none'
				}}
			/>
			<div className="relative z-10">
				<Navbar sessionId={sessionId} accessId={accessId} />
				<div className="pt-16">
					<Toolbar
						icao={session ? session.airportIcao : ''}
						sessionId={sessionId}
						accessId={accessId}
						activeRunway={session?.activeRunway}
						onRunwayChange={handleRunwayChange}
					/>
					<div className="-mt-4">
						{loading ? (
							<div className="text-center py-12 text-gray-400">
								Loading departures...
							</div>
						) : (
							<DepartureTable
								flights={flights}
								onFlightUpdate={handleFlightUpdate}
								onFlightDelete={handleFlightDelete}
								onFlightChange={flightsSocket?.updateFlight}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
