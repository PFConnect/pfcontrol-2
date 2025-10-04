import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { fetchFlights } from '../utils/fetch/flights';
import { fetchSession, updateSession } from '../utils/fetch/sessions';
import { fetchBackgrounds } from '../utils/fetch/data';
import { createFlightsSocket } from '../sockets/flightsSocket';
import { createArrivalsSocket } from '../sockets/arrivalsSocket';
import { useAuth } from '../hooks/auth/useAuth';
import { playSoundWithSettings } from '../utils/playSound';
import { useSettings } from '../hooks/settings/useSettings';
import type { Flight } from '../types/flight';
import Navbar from '../components/Navbar';
import Toolbar from '../components/tools/Toolbar';
import DepartureTable from '../components/tables/DepartureTable';
import ArrivalsTable from '../components/tables/ArrivalsTable';
import CombinedFlightsTable from '../components/tables/CombinedFlightsTable';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

interface SessionData {
	sessionId: string;
	airportIcao: string;
	activeRunway?: string;
	atis?: unknown;
	isPFATC: boolean;
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
	const isMobile = useMediaQuery({ maxWidth: 768 });

	const [session, setSession] = useState<SessionData | null>(null);
	const [flights, setFlights] = useState<Flight[]>([]);
	const [loading, setLoading] = useState(true);
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const [flightsSocket, setFlightsSocket] = useState<ReturnType<
		typeof createFlightsSocket
	> | null>(null);
	const [arrivalsSocket, setArrivalsSocket] = useState<ReturnType<
		typeof createArrivalsSocket
	> | null>(null);
	const [lastSessionId, setLastSessionId] = useState<string | null>(null);
	const [availableImages, setAvailableImages] = useState<AvailableImage[]>(
		[]
	);
	const [startupSoundPlayed, setStartupSoundPlayed] = useState(false);
	const { user } = useAuth();
	const { settings } = useSettings();
	const [currentView, setCurrentView] = useState<'departures' | 'arrivals'>(
		'departures'
	);
	const [externalArrivals, setExternalArrivals] = useState<Flight[]>([]);
	const [localHiddenFlights, setLocalHiddenFlights] = useState<
		Set<string | number>
	>(new Set());

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
				if (!startupSoundPlayed && user && settings) {
					playSoundWithSettings('startupSound', settings, 0.7).catch(
						(error) => {
							console.warn(
								'Failed to play session startup sound:',
								error
							);
						}
					);
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
		user,
		settings
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
			// onFlightAdded
			(flight: Flight) => {
				setFlights((prev) => [...prev, flight]);
				if (user && settings) {
					playSoundWithSettings('newStripSound', settings, 0.7).catch(
						(error) => {
							console.warn(
								'Failed to play new strip sound:',
								error
							);
						}
					);
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
	}, [sessionId, accessId, initialLoadComplete, user, settings]);

	useEffect(() => {
		if (
			!sessionId ||
			!accessId ||
			!initialLoadComplete ||
			!session?.isPFATC
		)
			return;

		const socket = createArrivalsSocket(
			sessionId,
			accessId,
			// onArrivalUpdated
			(flight: Flight) => {
				setExternalArrivals((prev) =>
					prev.map((f) => (f.id === flight.id ? flight : f))
				);
			},
			// onArrivalError
			(error) => {
				console.error('Arrival websocket error:', error);
			},
			// onInitialExternalArrivals
			(flights: Flight[]) => {
				console.log('Received initial external arrivals:', flights);
				setExternalArrivals(flights);
			}
		);
		setArrivalsSocket(socket);
		return () => {
			socket.socket.disconnect();
		};
	}, [sessionId, accessId, initialLoadComplete, session?.isPFATC]);

	const handleFlightUpdate = (
		flightId: string | number,
		updates: Partial<Flight>
	) => {
		if (Object.prototype.hasOwnProperty.call(updates, 'hidden')) {
			if (updates.hidden) {
				setLocalHiddenFlights((prev) => new Set(prev).add(flightId));
			} else {
				setLocalHiddenFlights((prev) => {
					const newSet = new Set(prev);
					newSet.delete(flightId);
					return newSet;
				});
			}
			return;
		}

		const isExternalArrival = externalArrivals.some(
			(f) => f.id === flightId
		);

		if (isExternalArrival && arrivalsSocket) {
			arrivalsSocket.updateArrival(flightId, updates);
		} else if (flightsSocket) {
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

	const handleViewChange = (view: 'departures' | 'arrivals') => {
		setCurrentView(view);
	};

	const departureFlights = useMemo(() => {
		return flights
			.filter(
				(flight) =>
					flight.departure?.toUpperCase() ===
					session?.airportIcao?.toUpperCase()
			)
			.map((flight) => ({
				...flight,
				hidden: localHiddenFlights.has(flight.id)
			}));
	}, [flights, session?.airportIcao, localHiddenFlights]);

	const arrivalFlights = useMemo(() => {
		const ownArrivals = flights.filter(
			(flight) =>
				flight.arrival?.toUpperCase() ===
				session?.airportIcao?.toUpperCase()
		);

		let baseArrivals = ownArrivals;
		if (session?.isPFATC) {
			baseArrivals = [...ownArrivals, ...externalArrivals];
		}

		return baseArrivals.map((flight) => ({
			...flight,
			hidden: localHiddenFlights.has(flight.id)
		}));
	}, [
		flights,
		externalArrivals,
		session?.airportIcao,
		session?.isPFATC,
		localHiddenFlights
	]);

	const filteredFlights = useMemo(() => {
		let baseFlights: Flight[] = [];

		if (currentView === 'arrivals') {
			const ownArrivals = flights.filter(
				(flight) =>
					flight.arrival?.toUpperCase() ===
					session?.airportIcao?.toUpperCase()
			);

			if (session?.isPFATC) {
				baseFlights = [...ownArrivals, ...externalArrivals];
			} else {
				baseFlights = ownArrivals;
			}
		} else {
			baseFlights = flights.filter(
				(flight) =>
					flight.departure?.toUpperCase() ===
					session?.airportIcao?.toUpperCase()
			);
		}

		return baseFlights.map((flight) => ({
			...flight,
			hidden: localHiddenFlights.has(flight.id)
		}));
	}, [
		flights,
		externalArrivals,
		currentView,
		session?.airportIcao,
		session?.isPFATC,
		localHiddenFlights
	]);

	const selectedImage = settings?.backgroundImage?.selectedImage;
	let backgroundImage = 'url("/assets/app/backgrounds/mdpc_01.png")';

	const getImageUrl = (filename: string | null): string | null => {
		if (!filename || filename === 'random' || filename === 'favorites') {
			return filename;
		}
		if (filename.startsWith('https://api.cephie.app/')) {
			return filename;
		}
		return `${API_BASE_URL}/assets/app/backgrounds/${filename}`;
	};

	if (selectedImage === 'random') {
		if (availableImages.length > 0) {
			const randomIndex = Math.floor(
				Math.random() * availableImages.length
			);
			backgroundImage = `url(${API_BASE_URL}${availableImages[randomIndex].path})`;
		}
	} else if (selectedImage === 'favorites') {
		const favorites = settings?.backgroundImage?.favorites || [];
		if (favorites.length > 0) {
			const randomFav =
				favorites[Math.floor(Math.random() * favorites.length)];
			// Updated: Use the helper function to get correct URL
			const favImageUrl = getImageUrl(randomFav);
			if (
				favImageUrl &&
				favImageUrl !== 'random' &&
				favImageUrl !== 'favorites'
			) {
				backgroundImage = `url(${favImageUrl})`;
			}
		}
	} else if (selectedImage) {
		const imageUrl = getImageUrl(selectedImage);
		if (imageUrl && imageUrl !== 'random' && imageUrl !== 'favorites') {
			backgroundImage = `url(${imageUrl})`;
		}
	}

	const showCombinedView = !isMobile && settings?.layout?.showCombinedView;
	const flightRowOpacity = settings?.layout?.flightRowOpacity ?? 100;

	const getBackgroundStyle = (opacity: number) => {
		if (opacity === 0) {
			return { backgroundColor: 'transparent' };
		}
		const alpha = opacity / 100;
		return {
			backgroundColor: `rgba(0, 0, 0, ${alpha})`
		};
	};

	const backgroundStyle = getBackgroundStyle(flightRowOpacity);

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
						isPFATC={session?.isPFATC}
						currentView={currentView}
						onViewChange={handleViewChange}
						showViewTabs={!showCombinedView}
					/>
					<div className="-mt-4">
						{loading ? (
							<div className="text-center py-12 text-gray-400">
								Loading {currentView}...
							</div>
						) : showCombinedView ? (
							<CombinedFlightsTable
								departureFlights={departureFlights}
								arrivalFlights={arrivalFlights}
								onFlightDelete={handleFlightDelete}
								onFlightChange={handleFlightUpdate}
								backgroundStyle={backgroundStyle}
							/>
						) : (
							<>
								{currentView === 'departures' ? (
									<DepartureTable
										flights={filteredFlights}
										onFlightDelete={handleFlightDelete}
										onFlightChange={handleFlightUpdate}
										backgroundStyle={backgroundStyle}
									/>
								) : (
									<ArrivalsTable
										flights={filteredFlights}
										onFlightChange={handleFlightUpdate}
										backgroundStyle={backgroundStyle}
									/>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
