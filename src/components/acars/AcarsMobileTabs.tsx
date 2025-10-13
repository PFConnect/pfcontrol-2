import { ZoomIn, ZoomOut } from 'lucide-react';
import Button from '../common/Button';
import { parseCallsign } from '../../utils/callsignParser';
import { formatTimestamp, getChartsForAirport } from '../../utils/acars';
import type { AcarsMessage } from '../../utils/acars';
import type { Flight } from '../../types/flight';

interface AcarsMobileTabsProps {
    mobileTab: 'terminal' | 'notes' | 'charts';
    flight: Flight | null;
    messages: AcarsMessage[];
    notes: string;
    selectedChart: string | null;
    chartZoom: number;
    chartPan: { x: number; y: number };
    chartLoadError: boolean;
    pdcRequested: boolean;
    onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onRequestPDC: () => void;
    onSelectChart: (path: string) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onChartMouseDown: (e: React.TouchEvent | React.MouseEvent) => void;
    onChartMouseMove: (e: React.TouchEvent | React.MouseEvent) => void;
    onChartMouseUp: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    isChartDragging: boolean;
    setMobileTab: React.Dispatch<
        React.SetStateAction<'terminal' | 'notes' | 'charts'>
    >;
}

export default function AcarsMobileTabs({
    mobileTab,
    flight,
    messages,
    notes,
    selectedChart,
    chartZoom,
    chartPan,
    chartLoadError,
    pdcRequested,
    onNotesChange,
    onRequestPDC,
    onSelectChart,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onChartMouseDown,
    onChartMouseMove,
    onChartMouseUp,
    messagesEndRef,
    isChartDragging,
    setMobileTab,
}: AcarsMobileTabsProps) {
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
        <div
            className="bg-gray-900 rounded-b-2xl border border-gray-800 border-t-0 overflow-hidden"
            style={{ height: 'calc(100vh - 220px)' }}
        >
            {mobileTab === 'terminal' && (
                <div className="h-full flex flex-col bg-black">
                    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
                        <span className="font-mono text-xs text-gray-300">
                            {flight?.callsign && (
                                <>
                                    {flight.callsign}
                                    <span className="text-gray-500 font-normal text-[10px] ml-2">
                                        {parseCallsign(
                                            flight.callsign || '',
                                            []
                                        )}
                                    </span>
                                </>
                            )}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={getMessageColor(msg.type)}
                            >
                                <span className="text-gray-500">
                                    {formatTimestamp(msg.timestamp)}
                                </span>{' '}
                                <span className="font-bold">
                                    [{msg.station}]:
                                </span>{' '}
                                {renderMessageText(msg)}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="bg-gray-900 border-t border-gray-800 p-3">
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-purple-400 border-purple-400 hover:bg-purple-950 text-xs"
                            onClick={onRequestPDC}
                            disabled={pdcRequested}
                        >
                            {pdcRequested ? 'PDC REQUESTED' : 'REQUEST PDC'}
                        </Button>
                    </div>
                </div>
            )}
            {mobileTab === 'notes' && (
                <div className="h-full p-3">
                    <textarea
                        value={notes}
                        onChange={onNotesChange}
                        placeholder="Loading flight plan details..."
                        className="w-full h-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-[10px] text-gray-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                    />
                </div>
            )}
            {mobileTab === 'charts' && (
                <div className="h-full flex flex-col">
                    {selectedChart && (
                        <div className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex items-center justify-center gap-1">
                            <button
                                onClick={onZoomOut}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                                onClick={onResetZoom}
                                className="px-2 py-1 hover:bg-gray-700 rounded transition-colors text-[10px] text-gray-400 font-mono"
                                title="Reset Zoom"
                            >
                                {Math.round(chartZoom * 100)}%
                            </button>
                            <button
                                onClick={onZoomIn}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        {!selectedChart ? (
                            <div className="p-3 space-y-4">
                                {flight && (
                                    <>
                                        <div>
                                            <h4 className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                                {flight.departure}
                                            </h4>
                                            <div className="space-y-1">
                                                {getChartsForAirport(
                                                    flight.departure || ''
                                                ).map((chart, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() =>
                                                            onSelectChart(
                                                                chart.path
                                                            )
                                                        }
                                                        className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded p-2 text-[10px] transition-colors cursor-pointer"
                                                    >
                                                        <div className="text-gray-300">
                                                            {chart.name}
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 mt-0.5">
                                                            {chart.type}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                {flight.arrival}
                                            </h4>
                                            <div className="space-y-1">
                                                {getChartsForAirport(
                                                    flight.arrival || ''
                                                ).map((chart, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() =>
                                                            onSelectChart(
                                                                chart.path
                                                            )
                                                        }
                                                        className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded p-2 text-[10px] transition-colors cursor-pointer"
                                                    >
                                                        <div className="text-gray-300">
                                                            {chart.name}
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 mt-0.5">
                                                            {chart.type}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {flight.alternate && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                                    {flight.alternate}
                                                </h4>
                                                <div className="space-y-1">
                                                    {getChartsForAirport(
                                                        flight.alternate
                                                    ).map((chart, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() =>
                                                                onSelectChart(
                                                                    chart.path
                                                                )
                                                            }
                                                            className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded p-2 text-[10px] transition-colors cursor-pointer"
                                                        >
                                                            <div className="text-gray-300">
                                                                {chart.name}
                                                            </div>
                                                            <div className="text-[9px] text-gray-500 mt-0.5">
                                                                {chart.type}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative h-full bg-black">
                                <button
                                    onClick={() => onSelectChart('')}
                                    className="absolute top-2 left-2 z-10 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1 rounded text-[10px] font-mono"
                                >
                                    ← Back to List
                                </button>
                                {chartLoadError ? (
                                    <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                                        Chart not available
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center overflow-hidden"
                                        onMouseDown={onChartMouseDown}
                                        onMouseMove={
                                            isChartDragging
                                                ? onChartMouseMove
                                                : undefined
                                        }
                                        onMouseUp={onChartMouseUp}
                                        onMouseLeave={onChartMouseUp}
                                        onTouchStart={onChartMouseDown}
                                        onTouchMove={onChartMouseMove}
                                        onTouchEnd={onChartMouseUp}
                                        style={{
                                            cursor: isChartDragging
                                                ? 'grabbing'
                                                : 'grab',
                                        }}
                                    >
                                        <img
                                            key={selectedChart}
                                            src={selectedChart}
                                            alt="Airport Chart"
                                            className="max-w-none"
                                            style={{
                                                transform: `translate(${chartPan.x}px, ${chartPan.y}px) scale(${chartZoom})`,
                                                transformOrigin: 'center',
                                                transition: isChartDragging
                                                    ? 'none'
                                                    : 'transform 0.1s ease-out',
                                                userSelect: 'none',
                                                pointerEvents: 'none',
                                                maxHeight: '100%',
                                            }}
                                            onLoad={() => {}}
                                            onError={() => {}}
                                            draggable={false}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
