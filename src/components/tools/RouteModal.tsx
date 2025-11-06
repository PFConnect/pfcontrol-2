import React, { useState, useRef, useCallback } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import type { Flight } from '../../types/flight';
import Button from '../common/Button';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
}

export default function RouteModal({
  isOpen,
  onClose,
  flight,
}: RouteModalProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen || !flight) return null;

  return (
    <>
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 bg-zinc-900 border-2 border-zinc-700 rounded-xl min-w-96 w-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800 rounded-t-lg cursor-grab"
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
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Departure
                </label>
                <div className="text-white font-mono text-lg">
                  {flight.departure || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Arrival
                </label>
                <div className="text-white font-mono text-lg">
                  {flight.arrival || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  SID
                </label>
                <div className="text-white font-mono text-lg">
                  {flight.sid || '-'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Route
              </label>
              <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4 min-h-32">
                {flight.route ? (
                  <div className="text-white font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {flight.route}
                  </div>
                ) : (
                  <div className="text-zinc-400 italic">No route specified</div>
                )}
              </div>
            </div>

            {flight.alternate && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Alternate
                </label>
                <div className="text-white font-mono">{flight.alternate}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
