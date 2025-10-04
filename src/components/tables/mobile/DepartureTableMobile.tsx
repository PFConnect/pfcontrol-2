import { useState } from 'react';
import { EyeOff, Eye, Trash2, FileSpreadsheet } from 'lucide-react';
import type { Flight } from '../../../types/flight';
import type { DepartureTableColumnSettings } from '../../../types/settings';
import Checkbox from '../../common/Checkbox';
import TextInput from '../../common/TextInput';
import AirportDropdown from '../../dropdowns/AirportDropdown';
import RunwayDropdown from '../../dropdowns/RunwayDropdown';
import AircraftDropdown from '../../dropdowns/AircraftDropdown';
import SidDropdown from '../../dropdowns/SidDropdown';
import AltitudeDropdown from '../../dropdowns/AltitudeDropdown';
import StatusDropdown from '../../dropdowns/StatusDropdown';
import Button from '../../common/Button';
import PDCModal from '../../tools/PDCModal';

interface DepartureTableProps {
	flights: Flight[];
	onFlightDelete: (flightId: string | number) => void;
	onFlightChange?: (
		flightId: string | number,
		updates: Partial<Flight>
	) => void;
	backgroundStyle?: React.CSSProperties;
	departureColumns?: DepartureTableColumnSettings;
	onPDCOpen?: (flight: Flight) => void;
}

export default function DepartureTableMobile({
	flights,
	onFlightDelete,
	onFlightChange,
	backgroundStyle,
	departureColumns = {
		time: true,
		callsign: true,
		stand: true,
		aircraft: true,
		wakeTurbulence: true,
		flightType: true,
		arrival: true,
		runway: true,
		sid: true,
		rfl: true,
		cfl: true,
		squawk: true,
		clearance: true,
		status: true,
		remark: true,
		pdc: true,
		hide: true,
		delete: true
	},
	onPDCOpen
}: DepartureTableProps) {
	const [showHidden, setShowHidden] = useState(false);
	const [pdcModalOpen, setPdcModalOpen] = useState(false);
	const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

	const handlePDCClick = (flight: Flight) => {
		if (onPDCOpen) {
			onPDCOpen(flight);
		} else {
			setSelectedFlight(flight);
			setPdcModalOpen(true);
		}
	};

	const handlePDCClose = () => {
		setPdcModalOpen(false);
		setSelectedFlight(null);
	};

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

	const handleDeleteFlight = async (flightId: string | number) => {
		onFlightDelete(flightId);
	};

	const handleToggleClearance = (
		flightId: string | number,
		checked: boolean
	) => {
		if (onFlightChange) {
			onFlightChange(flightId, { clearance: checked });
		}
	};

	const isClearanceChecked = (
		clearance: boolean | string | undefined
	): boolean => {
		if (typeof clearance === 'boolean') {
			return clearance;
		}
		if (typeof clearance === 'string') {
			return clearance.toLowerCase() === 'true';
		}
		return false;
	};

	const handleRemarkChange = (flightId: string | number, remark: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { remark });
		}
	};

	const handleCallsignChange = (
		flightId: string | number,
		callsign: string
	) => {
		if (onFlightChange) {
			onFlightChange(flightId, { callsign });
		}
	};

	const handleStandChange = (flightId: string | number, stand: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { stand });
		}
	};

	const handleSquawkChange = (flightId: string | number, squawk: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { squawk });
		}
	};

	const handleArrivalChange = (
		flightId: string | number,
		arrival: string
	) => {
		if (onFlightChange) {
			onFlightChange(flightId, { arrival });
		}
	};

	const handleRunwayChange = (flightId: string | number, runway: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { runway });
		}
	};

	const handleAircraftChange = (
		flightId: string | number,
		aircraft: string
	) => {
		if (onFlightChange) {
			onFlightChange(flightId, { aircraft });
		}
	};

	const handleSidChange = (flightId: string | number, sid: string) => {
		if (onFlightChange) {
			onFlightChange(flightId, { sid });
		}
	};

	const handleCruisingFLChange = (
		flightId: string | number,
		cruisingFL: string
	) => {
		if (onFlightChange) {
			onFlightChange(flightId, { cruisingFL });
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

	const visibleFlights = showHidden
		? flights
		: flights.filter((flight) => !flight.hidden);

	if (visibleFlights.length === 0) {
		return (
			<div className="mt-8 px-4 py-6 text-center text-gray-400">
				No departures found.
			</div>
		);
	}

	return (
		<div className="mt-8 px-4">
			{flights.some((flight) => flight.hidden) && (
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
			<div className="card-view space-y-4">
				{visibleFlights.map((flight) => (
					<div
						key={flight.id}
						className={`flight-card p-4 rounded-lg border border-zinc-700 ${
							flight.hidden ? 'opacity-60 text-gray-400' : ''
						}`}
						style={backgroundStyle}
					>
						<div className="grid grid-cols-2 gap-2 text-sm">
							{departureColumns.callsign !== false && (
								<div>
									<strong>Callsign:</strong>{' '}
									<TextInput
										value={flight.callsign || ''}
										onChange={(value) =>
											handleCallsignChange(
												flight.id,
												value
											)
										}
										className="bg-transparent border-none focus:bg-gray-800 px-1 rounded text-white"
										placeholder="-"
										maxLength={16}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.currentTarget.blur();
											}
										}}
									/>
								</div>
							)}
							{departureColumns.stand !== false && (
								<div>
									<strong>Stand:</strong>{' '}
									<TextInput
										value={flight.stand || ''}
										onChange={(value) =>
											handleStandChange(flight.id, value)
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
								</div>
							)}
							{departureColumns.aircraft !== false && (
								<div>
									<strong>Aircraft:</strong>{' '}
									<AircraftDropdown
										value={flight.aircraft}
										onChange={(type) =>
											handleAircraftChange(
												flight.id,
												type
											)
										}
										size="xs"
										showFullName={false}
									/>
								</div>
							)}
							{departureColumns.wakeTurbulence !== false && (
								<div>
									<strong>WTC:</strong> {flight.wtc || '-'}
								</div>
							)}
							{departureColumns.flightType !== false && (
								<div>
									<strong>Type:</strong>{' '}
									{flight.flight_type || '-'}
								</div>
							)}
							{departureColumns.arrival !== false && (
								<div>
									<strong>ADES:</strong>{' '}
									<AirportDropdown
										value={flight.arrival}
										onChange={(icao) =>
											handleArrivalChange(flight.id, icao)
										}
										size="xs"
										showFullName={false}
									/>
								</div>
							)}
							{departureColumns.runway !== false && (
								<div>
									<strong>Runway:</strong>{' '}
									<RunwayDropdown
										airportIcao={flight.departure || ''}
										value={flight.runway}
										onChange={(runway) =>
											handleRunwayChange(
												flight.id,
												runway
											)
										}
										size="xs"
										placeholder="-"
									/>
								</div>
							)}
							{departureColumns.sid !== false && (
								<div>
									<strong>SID:</strong>{' '}
									<SidDropdown
										airportIcao={flight.departure || ''}
										value={flight.sid}
										onChange={(sid) =>
											handleSidChange(flight.id, sid)
										}
										size="xs"
										placeholder="-"
									/>
								</div>
							)}
							{departureColumns.rfl !== false && (
								<div>
									<strong>RFL:</strong>{' '}
									<AltitudeDropdown
										value={flight.cruisingFL}
										onChange={(alt) =>
											handleCruisingFLChange(
												flight.id,
												alt
											)
										}
										size="xs"
										placeholder="-"
									/>
								</div>
							)}
							{departureColumns.cfl !== false && (
								<div>
									<strong>CFL:</strong>{' '}
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
								</div>
							)}
							{departureColumns.squawk !== false && (
								<div>
									<strong>Squawk:</strong>{' '}
									<TextInput
										value={flight.squawk || ''}
										onChange={(value) =>
											handleSquawkChange(flight.id, value)
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
								</div>
							)}
							{departureColumns.clearance !== false && (
								<div>
									<strong>Clearance:</strong>{' '}
									<Checkbox
										checked={isClearanceChecked(
											flight.clearance
										)}
										onChange={(checked) =>
											handleToggleClearance(
												flight.id,
												checked
											)
										}
										label=""
										checkedClass="bg-green-600 border-green-600"
									/>
								</div>
							)}
							{departureColumns.status !== false && (
								<div>
									<strong>Status:</strong>{' '}
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
									/>
								</div>
							)}
							{departureColumns.remark !== false && (
								<div className="col-span-2">
									<strong>Remark:</strong>{' '}
									<TextInput
										value={flight.remark || ''}
										onChange={(value) =>
											handleRemarkChange(flight.id, value)
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
								</div>
							)}
							{/* Time is always visible */}
							<div>
								<strong>Time:</strong>{' '}
								{flight.timestamp
									? new Date(
											flight.timestamp
									  ).toLocaleTimeString('en-GB', {
											hour: '2-digit',
											minute: '2-digit',
											timeZone: 'UTC'
									  })
									: '-'}
							</div>
						</div>
						<div className="flex gap-2 mt-4">
							{departureColumns.pdc !== false && (
								<button
									className="text-gray-400 hover:text-blue-500 px-2 py-1 rounded transition-colors"
									onClick={() => handlePDCClick(flight)}
									title="Generate PDC"
								>
									<FileSpreadsheet className="w-4 h-4" />
								</button>
							)}
							{departureColumns.hide !== false && (
								<button
									title={flight.hidden ? 'Unhide' : 'Hide'}
									className="text-gray-400 hover:text-blue-500 px-2 py-1 rounded"
									onClick={() =>
										flight.hidden
											? handleUnhideFlight(flight.id)
											: handleHideFlight(flight.id)
									}
								>
									{flight.hidden ? (
										<Eye className="w-4 h-4" />
									) : (
										<EyeOff className="w-4 h-4" />
									)}
								</button>
							)}
							{departureColumns.delete !== false && (
								<button
									title="Delete"
									className="text-gray-400 hover:text-red-500 px-2 py-1 rounded"
									onClick={() =>
										handleDeleteFlight(flight.id)
									}
								>
									<Trash2 className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>
				))}
			</div>

			{!onPDCOpen && (
				<PDCModal
					isOpen={pdcModalOpen}
					onClose={handlePDCClose}
					flight={selectedFlight}
				/>
			)}
		</div>
	);
}
