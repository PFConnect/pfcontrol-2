import { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import type { Flight } from '../../../types/flight';
import TextInput from '../../common/TextInput';
import StarDropdown from '../../dropdowns/StarDropdown';
import AltitudeDropdown from '../../dropdowns/AltitudeDropdown';
import StatusDropdown from '../../dropdowns/StatusDropdown';
import Button from '../../common/Button';

interface ArrivalsTableMobileProps {
	flights: Flight[];
	onFlightChange?: (
		flightId: string | number,
		updates: Partial<Flight>
	) => void;
	backgroundStyle?: React.CSSProperties;
}

export default function ArrivalsTableMobile({
	flights,
	onFlightChange,
	backgroundStyle
}: ArrivalsTableMobileProps) {
	const [showHidden, setShowHidden] = useState(false);

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

	const visibleFlights = showHidden
		? flights
		: flights.filter((flight) => !flight.hidden);

	const hasHiddenFlights = flights.some((flight) => flight.hidden);

	return (
		<div className="mt-8 px-4">
			{hasHiddenFlights && (
				<div className="mb-4 flex items-center gap-2">
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
				<div className="py-8 text-center text-gray-400">
					No arrivals found.
				</div>
			) : (
				<div className="space-y-4">
					{visibleFlights.map((flight) => (
						<div
							key={flight.id}
							className={`flight-card p-4 rounded-lg border ${
								flight.hidden
									? 'opacity-60 text-gray-400 border-gray-600'
									: 'border-gray-700'
							}`}
							style={backgroundStyle}
						>
							<div className="flex justify-between items-start mb-3">
								<div>
									<h3 className="text-lg font-bold text-green-400">
										{flight.callsign || 'Unknown'}
									</h3>
									<p className="text-sm text-gray-400">
										{flight.departure} → {flight.arrival}
									</p>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() =>
											flight.hidden
												? handleUnhideFlight(flight.id)
												: handleHideFlight(flight.id)
										}
										className="text-gray-400 hover:text-blue-500"
									>
										{flight.hidden ? (
											<Eye className="w-5 h-5" />
										) : (
											<EyeOff className="w-5 h-5" />
										)}
									</button>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<label className="block text-gray-400 mb-1">
										Gate
									</label>
									<TextInput
										value={flight.gate || ''}
										onChange={(value) =>
											onFlightChange?.(flight.id, {
												gate: value
											})
										}
										placeholder="-"
										maxLength={8}
									/>
								</div>

								<div>
									<label className="block text-gray-400 mb-1">
										STAR
									</label>
									<StarDropdown
										airportIcao={flight.arrival || ''}
										value={flight.star}
										onChange={(star) =>
											onFlightChange?.(flight.id, {
												star
											})
										}
										size="sm"
										placeholder="-"
									/>
								</div>

								<div>
									<label className="block text-gray-400 mb-1">
										CFL
									</label>
									<AltitudeDropdown
										value={flight.clearedFL}
										onChange={(alt) =>
											onFlightChange?.(flight.id, {
												clearedFL: alt
											})
										}
										size="sm"
										placeholder="-"
									/>
								</div>

								<div>
									<label className="block text-gray-400 mb-1">
										Status
									</label>
									<StatusDropdown
										value={flight.status}
										onChange={(status) =>
											onFlightChange?.(flight.id, {
												status
											})
										}
										size="sm"
										placeholder="-"
										isArrival={true}
									/>
								</div>

								<div>
									<label className="block text-gray-400 mb-1">
										Squawk
									</label>
									<TextInput
										value={flight.squawk || ''}
										onChange={(value) =>
											onFlightChange?.(flight.id, {
												squawk: value
											})
										}
										placeholder="-"
										maxLength={4}
										pattern="[0-9]*"
									/>
								</div>

								<div className="col-span-2">
									<label className="block text-gray-400 mb-1">
										Remarks
									</label>
									<TextInput
										value={flight.remark || ''}
										onChange={(value) =>
											onFlightChange?.(flight.id, {
												remark: value
											})
										}
										placeholder="-"
										maxLength={50}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
