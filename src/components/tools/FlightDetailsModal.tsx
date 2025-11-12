import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, GripHorizontal, RefreshCw } from 'lucide-react';
import type { Flight } from '../../types/flight';

interface FlightDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  onFlightChange?: (
    flightId: string | number,
    updates: Partial<Flight>
  ) => void;
}

export default function FlightDetailsModal({
  isOpen,
  onClose,
  flight,
  onFlightChange,
}: FlightDetailsModalProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const [editedRoute, setEditedRoute] = useState(flight?.route || '');

  const generateRandomSquawk = useCallback((): string => {
    let squawk = '';
    for (let i = 0; i < 4; i++) {
      squawk += Math.floor(Math.random() * 6) + 1;
    }
    return squawk;
  }, []);

  const handleRegenerateSquawk = useCallback(() => {
    if (flight && onFlightChange) {
      const newSquawk = generateRandomSquawk();
      onFlightChange(flight.id, { squawk: newSquawk });
    }
  }, [flight, onFlightChange, generateRandomSquawk]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current) return;

    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (flight?.route !== undefined) {
      setEditedRoute(flight.route || '');
    }
  }, [flight?.route]);

  // Autosave with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (flight && onFlightChange) {
        onFlightChange(flight.id, { route: editedRoute });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editedRoute, flight, onFlightChange]);

  if (!isOpen || !flight) return null;

  return (
    <>
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-60 bg-zinc-900 border-2 border-blue-600 rounded-xl min-w-[32rem] w-[40rem] max-h-[90vh] overflow-y-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 py-3 border-b border-zinc-700 bg-zinc-800 rounded-t-lg cursor-pointer sticky top-0 z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-bold text-white">
              {flight.callsign || 'Unknown'} - {flight.aircraft || 'N/A'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Flight Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Callsign
              </label>
              <div className="text-white font-mono text-lg font-bold">
                {flight.callsign || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Aircraft
              </label>
              <div className="text-white font-mono text-lg">
                {flight.aircraft || '-'}
              </div>
            </div>
          </div>

          {/* Squawk & Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Squawk
              </label>
              <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded">
                <div className="text-white font-mono text-lg font-bold flex-1">
                  {flight.squawk || '-'}
                </div>
                <button
                  onClick={handleRegenerateSquawk}
                  className="text-zinc-400 hover:text-blue-500 transition-colors flex-shrink-0"
                  title="Generate new squawk"
                  type="button"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Status
              </label>
              <div className="text-white font-mono text-sm px-3 py-2 rounded">
                {flight.status || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Cleared
              </label>
              <div className={`font-mono text-lg font-bold px-3 py-2 rounded text-center ${
                flight.cleared ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}>
                {flight.cleared ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* Route Section */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Airports
            </label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-green-500 mb-1">
                  Departure
                </label>
                <div className="text-white font-mono text-lg font-bold">
                  {flight.departure || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-500 mb-1">
                  SID
                </label>
                <div className="text-white font-mono text-lg">
                  {flight.sid || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-500 mb-1">
                  STAR
                </label>
                <div className="text-white font-mono text-lg">
                  {flight.star || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-red-500 mb-1">
                  Arrival
                </label>
                <div className="text-white font-mono text-lg font-bold">
                  {flight.arrival || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Route
            </label>
            <textarea
              value={editedRoute}
              onChange={(e) => setEditedRoute(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg p-4 text-white font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Enter route..."
              rows={4}
            />
          </div>

          {/* PDC Section */}
          {flight.pdc_remarks && (
            <div className="border-t border-zinc-700 pt-4">
              <label className="block text-sm font-medium text-amber-500 mb-2">
                Issued PDC
              </label>
              <div className="bg-zinc-800 border border-amber-600/30 rounded-lg p-4">
                <pre className="text-amber-100 font-mono text-xs whitespace-pre-wrap">
                  {flight.pdc_remarks}
                </pre>
              </div>
            </div>
          )}

          {/* Alternate */}
          {flight.alternate && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Alternate
              </label>
              <div className="text-white font-mono bg-zinc-800 px-3 py-2 rounded">
                {flight.alternate}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 border-t border-zinc-700 pt-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Cruise Altitude
              </label>
              <div className="text-white font-mono">
                {flight.altitude ? `FL${Math.floor(flight.altitude / 100)}` : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Remarks
              </label>
              <div className="text-white font-mono text-sm">
                {flight.remarks || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
