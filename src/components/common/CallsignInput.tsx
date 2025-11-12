import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../../hooks/data/useData';
import { ChevronDown } from 'lucide-react';

interface CallsignInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

export default function CallsignInput({
  value,
  onChange,
  placeholder = 'e.g. DLH123',
  required = false,
  maxLength = 16,
}: CallsignInputProps) {
  const { airlines } = useData();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredAirlines, setFilteredAirlines] = useState(airlines);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (!value) {
    setFilteredAirlines(airlines);
    return;
  }

  const searchTerm = value.toUpperCase();
  const filtered = airlines.filter(
    (airline) =>
    airline.icao.toUpperCase().startsWith(searchTerm) ||
    airline.callsign.toUpperCase().startsWith(searchTerm) ||
    airline.callsign.toUpperCase().includes(searchTerm)
  );

  filtered.sort((a, b) => {
    const aIcaoMatch = a.icao.toUpperCase().startsWith(searchTerm);
    const bIcaoMatch = b.icao.toUpperCase().startsWith(searchTerm);
    const aCallsignMatch = a.callsign.toUpperCase().startsWith(searchTerm);
    const bCallsignMatch = b.callsign.toUpperCase().startsWith(searchTerm);

    if (aIcaoMatch && !bIcaoMatch) return -1;
    if (!aIcaoMatch && bIcaoMatch) return 1;
    if (aCallsignMatch && !bCallsignMatch) return -1;
    if (!aCallsignMatch && bCallsignMatch) return 1;
    return a.icao.localeCompare(b.icao);
  });

  setFilteredAirlines(filtered);
  }, [value, airlines]);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
    dropdownRef.current &&
    !dropdownRef.current.contains(event.target as Node) &&
    inputRef.current &&
    !inputRef.current.contains(event.target as Node)
    ) {
    setShowSuggestions(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value.toUpperCase();
  onChange(newValue);
  setShowSuggestions(true);
  };

  const handleAirlineSelect = (icao: string) => {
  onChange(icao);
  setShowSuggestions(false);
  // Blur the input to force a "click away" state
  inputRef.current?.blur();
  };

  const handleInputFocus = () => {
  setShowSuggestions(true);
  };

  // Parse the callsign to check if it's valid
  const parsedCallsign = useMemo(() => {
  if (!value || value.length < 4) return null;

  // Callsigns should follow pattern: 2-3 letter airline code + flight number (with numbers)
  // Examples: DAL123, AAL42, DLH456A
  const callsignPattern = /^([A-Z]{2,3})(\d+[A-Z]?)$/;
  const match = value.match(callsignPattern);

  if (!match) return null;

  const airlineCode = match[1];
  const flightNumber = match[2];
  const airline = airlines.find((a) => a.icao === airlineCode);

  if (airline) {
    const formattedName = airline.callsign
    .split(' ')
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
    return `${formattedName} ${flightNumber}`;
  }

  return null;
  }, [value, airlines]);

  return (
  <div className="relative">
    <div className="relative">
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInputChange}
      onFocus={handleInputFocus}
      required={required}
      placeholder={placeholder}
      className="flex items-center w-full pl-6 pr-10 p-3 bg-gray-800 border-2 border-blue-600 rounded-full text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
      maxLength={maxLength}
    />
    {filteredAirlines.length > 0 && (
      <button
      type="button"
      onClick={() => setShowSuggestions(!showSuggestions)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
      >
      <ChevronDown
        className={`h-5 w-5 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
      />
      </button>
    )}
    </div>

    {showSuggestions && filteredAirlines.length > 0 && (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-full mt-2 bg-gray-800 border-2 border-blue-600 rounded-lg shadow-xl max-h-64 overflow-y-auto"
    >
      <div className="p-2">
      <div className="text-xs text-gray-400 px-3 py-2 font-medium uppercase">
        {value.length <= 3 ? 'Airline ICAO Codes' : 'Matching Airlines'}
      </div>
      {filteredAirlines.slice(0, 50).map((airline, index) => (
        <button
        key={`${airline.icao}-${airline.callsign}-${index}`}
        type="button"
        onClick={() => handleAirlineSelect(airline.icao)}
        className="w-full text-left px-3 py-2 hover:bg-blue-600/30 rounded-md transition-colors group"
        >
        <div className="flex items-center justify-between">
          <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">
            {airline.icao}
            </span>
            <span className="text-gray-500 text-xs">→</span>
            <span className="text-gray-300 text-sm">
            {airline.callsign}
            </span>
          </div>
          </div>
          <div className="text-xs text-gray-500 group-hover:text-blue-300 transition-colors">
          Use {airline.icao}
          </div>
        </div>
        </button>
      ))}
      {filteredAirlines.length > 50 && (
        <div className="text-xs text-gray-500 px-3 py-2 text-center">
        +{filteredAirlines.length - 50} more... Keep typing to filter
        </div>
      )}
      </div>
    </div>
    )}

    {value.length > 0 && filteredAirlines.length > 0 && (
    <div className="mt-2 text-xs text-gray-400">
      <span>
      {value.length <= 3
        ? 'Select an airline ICAO code (e.g., DLH for Lufthansa), then add your flight number (e.g., DLH123)'
        : `Found ${filteredAirlines.length} matching airline${filteredAirlines.length === 1 ? '' : 's'}. Click to use the ICAO code.`}
      </span>
    </div>
    )}
    {value.length > 0 && filteredAirlines.length === 0 && (
    <div className="mt-2 text-xs text-gray-400">
      {parsedCallsign ? (
      <span className="text-green-400">
        <span className="font-semibold pl-5">{parsedCallsign}</span>
      </span>
      ) : (
      <span>
        No airlines found. You can still enter any callsign manually.
      </span>
      )}
    </div>
    )}
  </div>
  );
}
