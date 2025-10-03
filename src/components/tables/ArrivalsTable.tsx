import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { EyeOff, Eye } from 'lucide-react';
import type { Flight } from '../../types/flight';
import TextInput from '../common/TextInput';
import StarDropdown from '../dropdowns/StarDropdown';
import AltitudeDropdown from '../dropdowns/AltitudeDropdown';
import StatusDropdown from '../dropdowns/StatusDropdown';
import Button from '../common/Button';
import ArrivalsTableMobile from './mobile/ArrivalsTableMobile';

interface ArrivalsTableProps {
	flights: Flight[];
	onFlightChange?: (
		flightId: string | number,
		updates: Partial<Flight>
	) => void;
}

export default function ArrivalsTable({
	flights,
	onFlightChange
}: ArrivalsTableProps) {
	const [showHidden, setShowHidden] = useState(false);
	const isMobile = useMediaQuery({ maxWidth: 1000 });

	const handleHideFlight = async (flightId: string | number) => {
		if (onFlightChange) {
			onFlightChange(flightId, { hidden: true });
		}
	};

	const handleUnhideFlight = async (flightId: string | number) => {
		if (onFlightChange) {
			onFlightChange(flightId, { hidden: false });
		}
	};

	const handleRemarkChange = (flightId: string | number, remark: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { remark });
		}
	};

	const handleSquawkChange = (flightId: string | number, squawk: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { squawk });
		}
	};

	const handleStarChange = (flightId: string | number, star: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { star });
		}
	};

	const handleClearedFLChange = (
		flightId: string | number,
		clearedFL: string
	) => {
		if (onFlightChange) {
			onFlightChange(flightId, { clearedFL });
		}
	};

	const handleStatusChange = (flightId: string | number, status: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { status });
		}
	};

	const handleGateChange = (flightId: string | number, gate: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { gate });
		}
	};

	const visibleFlights = showHidden
		? flights
		: flights.filter((flight) => !flight.hidden);

	const hasHiddenFlights = flights.some((flight) => flight.hidden);

	if (isMobile) {
		return (
			<ArrivalsTableMobile
				flights={flights}
				onFlightChange={onFlightChange}
			/>
		);
	}

	return (
		<div className="mt-8 px-4">
			{hasHiddenFlights && (
				<div className="mb-2 flex items-center gap-2">
					<Button
						className="px-3 py-1 rounded flex items-center gap-1"
						onClick={() => setShowHidden((v) => !v)}
						variant="outline"
						size="sm"
					>
						{showHidden ? (
							<Eye className="w-4 h-4" />
						) : (
							<EyeOff className="w-4 h-4" />
						)}
						{showHidden
							? 'Hide hidden flights'
							: 'Show hidden flights'}
					</Button>
				</div>
			)}

			{visibleFlights.length === 0 ? (
				<div className="mt-24 px-4 py-6 text-center text-gray-400">
					No arrivals found.
				</div>
			) : (
				<div className="table-view">
					<table className="min-w-full bg-zinc-900 rounded-lg">
						<thead>
							<tr className="bg-green-950 text-green-200">
								<th className="py-2.5 px-4 text-left column-time">
									TIME
								</th>
								<th className="py-2.5 px-4 text-left">
									CALLSIGN
								</th>
								<th className="py-2.5 px-4 text-left w-24 column-gate">
									GATE
								</th>
								<th className="py-2.5 px-4 text-left">ATYP</th>
								<th className="py-2.5 px-4 text-left column-w">
									W
								</th>
								<th className="py-2.5 px-4 text-left">V</th>
								<th className="py-2.5 px-4 text-left">ADEP</th>
								<th className="py-2.5 px-4 text-left column-rwy">
									RWY
								</th>
								<th className="py-2.5 px-4 text-left">STAR</th>
								<th className="py-2.5 px-4 text-left column-rfl">
									RFL
								</th>
								<th className="py-2.5 px-4 text-left">CFL</th>
								<th className="py-2.5 px-4 text-left w-28">
									ASSR
								</th>
								<th className="py-2.5 px-4 text-left">STS</th>
								<th className="py-2.5 px-4 text-left w-64 column-rmk">
									RMK
								</th>
								<th className="py-2.5 px-4 text-left column-hide">
									HIDE
								</th>
							</tr>
						</thead>
						<tbody>
							{visibleFlights.map((flight) => (
								<tr
									key={flight.id}
									className={`${
										flight.hidden
											? 'bg-zinc-800 text-gray-500'
											: ''
									}`}
								>
									<td className="py-2 px-4 column-time">
										{flight.timestamp
											? new Date(
													flight.timestamp
											  ).toLocaleTimeString('en-GB', {
													hour: '2-digit',
													minute: '2-digit',
													timeZone: 'UTC'
											  })
											: '-'}
									</td>
									<td className="py-2 px-4">
										<span className="text-white font-mono">
											{flight.callsign || '-'}
										</span>
									</td>
									<td className="py-2 px-4 column-gate">
										<TextInput
											value={flight.gate || ''}
											onChange={(value) =>
												handleGateChange(
													flight.id,
													value
												)
											}
											className="bg-transparent border-none focus:bg-gray-800 px-1 rounded text-white"
											placeholder="-"
											maxLength={8}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.currentTarget.blur();
												}
											}}
										/>
									</td>
									<td className="py-2 px-4">
										<span className="text-white font-mono">
											{flight.aircraft || '-'}
										</span>
									</td>
									<td className="py-2 px-4 column-w">
										{flight.wtc || '-'}
									</td>
									<td className="py-2 px-4">
										{flight.flight_type || '-'}
									</td>
									<td className="py-2 px-4">
										<span className="text-white font-mono">
											{flight.departure || '-'}
										</span>
									</td>
									<td className="py-2 px-4 column-rwy">
										<span className="text-white font-mono">
											{flight.runway || '-'}
										</span>
									</td>
									<td className="py-2 px-4">
										<StarDropdown
											airportIcao={flight.arrival || ''}
											value={flight.star}
											onChange={(star) =>
												handleStarChange(
													flight.id,
													star
												)
											}
											size="xs"
											placeholder="-"
										/>
									</td>
									<td className="py-2 px-4 column-rfl">
										<span className="text-white font-mono">
											{flight.cruisingFL || '-'}
										</span>
									</td>
									<td className="py-2 px-4">
										<AltitudeDropdown
											value={flight.clearedFL}
											onChange={(alt) =>
												handleClearedFLChange(
													flight.id,
													alt
												)
											}
											size="xs"
											placeholder="-"
										/>
									</td>
									<td className="py-2 px-4">
										<TextInput
											value={flight.squawk || ''}
											onChange={(value) =>
												handleSquawkChange(
													flight.id,
													value
												)
											}
											className="bg-transparent border-none focus:bg-gray-800 px-1 rounded text-white"
											placeholder="-"
											maxLength={4}
											pattern="[0-9]*"
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.currentTarget.blur();
												}
											}}
										/>
									</td>
									<td className="py-2 px-4">
										<StatusDropdown
											value={flight.status}
											onChange={(status) =>
												handleStatusChange(
													flight.id,
													status
												)
											}
											size="xs"
											placeholder="-"
											isArrival={true}
										/>
									</td>
									<td className="py-2 px-4 column-rmk">
										<TextInput
											value={flight.remark || ''}
											onChange={(value) =>
												handleRemarkChange(
													flight.id,
													value
												)
											}
											className="bg-transparent border-none focus:bg-gray-800 px-1 rounded text-white"
											placeholder="-"
											maxLength={50}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.currentTarget.blur();
												}
											}}
										/>
									</td>
									<td className="py-2 px-4 column-hide">
										<button
											title={
												flight.hidden
													? 'Unhide'
													: 'Hide'
											}
											className="text-gray-400 hover:text-blue-500"
											onClick={() =>
												flight.hidden
													? handleUnhideFlight(
															flight.id
													  )
													: handleHideFlight(
															flight.id
													  )
											}
										>
											{flight.hidden ? (
												<Eye />
											) : (
												<EyeOff />
											)}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
