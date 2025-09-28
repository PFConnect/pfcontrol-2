import type { Flight } from '../../types/flight';

interface DepartureTableProps {
	flights: Flight[];
}

export default function DepartureTable({ flights }: DepartureTableProps) {
	return (
		<div className="mt-8 px-4">
			<table className="min-w-full bg-zinc-900 rounded-lg overflow-hidden">
				<thead>
					<tr className="bg-blue-950 text-blue-200">
						<th className="py-3 px-4 text-left">Callsign</th>
						<th className="py-3 px-4 text-left">Aircraft</th>
						<th className="py-3 px-4 text-left">Departure</th>
						<th className="py-3 px-4 text-left">Arrival</th>
						<th className="py-3 px-4 text-left">Route</th>
						<th className="py-3 px-4 text-left">Flight Level</th>
						<th className="py-3 px-4 text-left">Status</th>
					</tr>
				</thead>
				<tbody>
					{flights.length === 0 ? (
						<tr>
							<td
								colSpan={7}
								className="py-6 px-4 text-center text-gray-400"
							>
								No departures found.
							</td>
						</tr>
					) : (
						flights.map((flight) => (
							<tr
								key={flight.id}
								className="border-b border-zinc-800"
							>
								<td className="py-2 px-4">{flight.callsign}</td>
								<td className="py-2 px-4">
									{flight.aircraft_type || flight.aircraft}
								</td>
								<td className="py-2 px-4">
									{flight.departure}
								</td>
								<td className="py-2 px-4">{flight.arrival}</td>
								<td className="py-2 px-4">{flight.route}</td>
								<td className="py-2 px-4">
									{flight.cruisingFL || flight.rfl}
								</td>
								<td className="py-2 px-4">
									{flight.status || '-'}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
