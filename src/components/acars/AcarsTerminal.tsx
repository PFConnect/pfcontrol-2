import { Terminal } from 'lucide-react';
import Button from '../common/Button';
import { parseCallsign } from '../../utils/callsignParser';
import { formatTimestamp } from '../../utils/acars';
import type { AcarsMessage } from '../../utils/acars';
import type { Flight } from '../../types/flight';
import type { Airline } from '../../types/airlines';

export interface AcarsTerminalProps {
    flight: Flight | null;
    messages: AcarsMessage[];
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    renderMessageText: (msg: AcarsMessage) => React.ReactElement;
    onRequestPDC: () => void;
    pdcRequested: boolean;
    airlines: Airline[];
}

export default function AcarsTerminal({
    flight,
    messages,
    pdcRequested,
    onRequestPDC,
    messagesEndRef,
}: AcarsTerminalProps) {
    const getMessageColor = (type: AcarsMessage['type']) => {
        switch (type) {
            case 'warning':
                return 'text-red-400';
            case 'pdc':
                return 'text-cyan-400';
            case 'Success':
                return 'text-green-400';
            case 'system':
                return 'text-white';
            case 'contact':
                return 'text-orange-400';
            case 'atis':
                return 'text-blue-400';
            default:
                return 'text-white';
        }
    };

    const renderMessageText = (msg: AcarsMessage) => (
        <span className="whitespace-pre-wrap">
            {msg.text}
            {msg.link && (
                <a
                    href={msg.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
                >
                    {msg.link.text}
                </a>
            )}
        </span>
    );

    return (
        <div className="flex-1 flex flex-col bg-black">
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="font-mono text-sm text-gray-300">
                        {flight?.callsign ? (
                            <>
                                {flight.callsign}
                                <span className="text-gray-500 font-normal text-xs ml-2">
                                    {parseCallsign(flight.callsign || '', [])}
                                </span>{' '}
                                {/* Pass airlines if needed */}
                            </>
                        ) : (
                            'Terminal'
                        )}
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5">
                {messages.map((msg) => (
                    <div key={msg.id} className={getMessageColor(msg.type)}>
                        <span className="text-gray-500">
                            {formatTimestamp(msg.timestamp)}
                        </span>{' '}
                        <span className="font-bold">[{msg.station}]:</span>{' '}
                        {renderMessageText(msg)}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="bg-gray-900 border-t border-gray-800 p-3">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-400 border-purple-400 hover:bg-purple-950"
                        onClick={onRequestPDC}
                        disabled={pdcRequested}
                    >
                        {pdcRequested ? 'PDC REQUESTED' : 'REQUEST PDC'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
