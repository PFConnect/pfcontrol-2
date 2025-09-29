// src/components/tables/DepartureTable.tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { updateFlight, deleteFlight } from "../../utils/fetch/flights";
import type { Flight } from "../../types/flight";
import { EyeOff, Eye, Trash2 } from "lucide-react";

interface DepartureTableProps {
   flights: Flight[];
}

export default function DepartureTable({ flights }: DepartureTableProps) {
   const { sessionId } = useParams<{ sessionId?: string }>();
   const [showHidden, setShowHidden] = useState(false);

   const handleHideFlight = async (flightId: string | number) => {
      try {
         if (!sessionId) return;
         await updateFlight(sessionId, flightId, { hidden: true });
      } catch (err) {
         console.error("Failed to hide flight:", err);
      }
   };

   const handleDeleteFlight = async (flightId: string | number) => {
      try {
         if (!sessionId) return;
         await deleteFlight(flightId as number);
      } catch (err) {
         console.error("Failed to delete flight:", err);
      }
   };

   const visibleFlights = showHidden
      ? flights
      : flights.filter((flight) => !flight.hidden);

   return (
      <div className="mt-8 px-4">
         <div className="mb-2 flex items-center gap-2">
            <button
               className="bg-zinc-800 text-blue-200 px-3 py-1 rounded flex items-center gap-1"
               onClick={() => setShowHidden((v) => !v)}
            >
               {showHidden ? (
                  <Eye className="w-4 h-4" />
               ) : (
                  <EyeOff className="w-4 h-4" />
               )}
               {showHidden ? "Hide hidden flights" : "Show hidden flights"}
            </button>
         </div>
         <table className="min-w-full bg-zinc-900 rounded-lg overflow-hidden">
            <thead>
               <tr className="bg-blue-950 text-blue-200">
                  <th className="py-3 px-4 text-left">TIME</th>
                  <th className="py-3 px-4 text-left">CALLSIGN</th>
                  <th className="py-3 px-4 text-left">STAND</th>
                  <th className="py-3 px-4 text-left">ATYP</th>
                  <th className="py-3 px-4 text-left">W</th>
                  <th className="py-3 px-4 text-left">V</th>
                  <th className="py-3 px-4 text-left">ADES</th>
                  <th className="py-3 px-4 text-left">RWY</th>
                  <th className="py-3 px-4 text-left">SID</th>
                  <th className="py-3 px-4 text-left">RFL</th>
                  <th className="py-3 px-4 text-left">CFL</th>
                  <th className="py-3 px-4 text-left">ASSR</th>
                  <th className="py-3 px-4 text-left">C</th>
                  <th className="py-3 px-4 text-left">STS</th>
                  <th className="py-3 px-4 text-left">RMK</th>
                  <th className="py-3 px-4 text-left">PDC</th>
                  <th className="py-3 px-4 text-left">HIDE</th>
                  <th className="py-3 px-4 text-left">DEL</th>
               </tr>
            </thead>
            <tbody>
               {visibleFlights.length === 0 ? (
                  <tr>
                     <td
                        colSpan={18}
                        className="py-6 px-4 text-center text-gray-400"
                     >
                        No departures found.
                     </td>
                  </tr>
               ) : (
                  visibleFlights.map((flight) => (
                     <tr
                        key={flight.id}
                        className={`border-b border-zinc-800 ${
                           flight.hidden ? "bg-zinc-800 text-gray-500" : ""
                        }`}
                     >
                        <td className="py-2 px-4">
                           {flight.timestamp
                              ? new Date(flight.timestamp).toLocaleTimeString(
                                   "en-GB",
                                   {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "UTC",
                                   }
                                )
                              : "-"}
                        </td>
                        <td className="py-2 px-4">{flight.callsign || "-"}</td>
                        <td className="py-2 px-4">{flight.stand || "-"}</td>
                        <td className="py-2 px-4">{flight.aircraft || "-"}</td>
                        <td className="py-2 px-4">{flight.wtc || "-"}</td>
                        <td className="py-2 px-4">
                           {flight.flight_type || "-"}
                        </td>
                        <td className="py-2 px-4">{flight.arrival || "-"}</td>
                        <td className="py-2 px-4">{flight.runway || "-"}</td>
                        <td className="py-2 px-4">{flight.sid || "-"}</td>
                        <td className="py-2 px-4">
                           {flight.cruisingFL || "-"}
                        </td>
                        <td className="py-2 px-4">{flight.clearedFL || "-"}</td>
                        <td className="py-2 px-4">{flight.squawk || "-"}</td>
                        <td className="py-2 px-4">
                           <input
                              type="checkbox"
                              checked={!!flight.clearance}
                              readOnly
                           />
                        </td>
                        <td className="py-2 px-4">{flight.status || "-"}</td>
                        <td className="py-2 px-4">{flight.remark || "-"}</td>
                        <td className="py-2 px-4">
                           <button
                              className="bg-blue-700 text-white px-2 py-1 rounded"
                              onClick={() => {
                                 /* open PDC modal logic here */
                              }}
                           >
                              PDC
                           </button>
                        </td>
                        <td className="py-2 px-4">
                           <button
                              title="Hide"
                              className="text-gray-400 hover:text-red-500"
                              onClick={() => handleHideFlight(flight.id)}
                              disabled={flight.hidden}
                           >
                              <EyeOff />
                           </button>
                        </td>
                        <td className="py-2 px-4">
                           <button
                              title="Delete"
                              className="text-gray-400 hover:text-red-500"
                              onClick={() => handleDeleteFlight(flight.id)}
                           >
                              <Trash2 />
                           </button>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
