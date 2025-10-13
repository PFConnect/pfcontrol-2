import { User, Radio, ChevronRight } from 'lucide-react';
import type { OverviewSession } from '../../sockets/overviewSocket';

interface AcarsMobileDrawerProps {
    isOpen: boolean;
    activeSessions: OverviewSession[];
    onAtisClick: (session: OverviewSession) => void;
    onClose: () => void;
}

export default function AcarsMobileDrawer({
    isOpen,
    activeSessions,
    onAtisClick,
    onClose,
}: AcarsMobileDrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-900 border-l border-gray-800 z-50 flex flex-col animate-slide-in">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <span className="text-sm font-mono text-gray-300">
                        Controllers & ATIS
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <div className="p-3 border-b border-gray-800">
                    <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        CONTROLLERS
                    </h3>
                    <div className="space-y-2 text-xs">
                        {activeSessions.map((session) => (
                            <div
                                key={session.sessionId}
                                className="text-gray-300"
                            >
                                <div className="font-semibold text-cyan-400 text-xs">
                                    {session.airportIcao}
                                </div>
                                {session.controllers &&
                                session.controllers.length > 0 ? (
                                    <div className="ml-2 mt-0.5 space-y-0.5">
                                        {session.controllers.map(
                                            (controller, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-[10px] flex items-center gap-1"
                                                >
                                                    <span className="text-gray-500">
                                                        •
                                                    </span>
                                                    <span className="text-gray-300">
                                                        {controller.username}
                                                    </span>
                                                    <span className="text-gray-600">
                                                        ({controller.role})
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-500 ml-2">
                                        {session.activeUsers} controller(s)
                                    </div>
                                )}
                            </div>
                        ))}
                        {activeSessions.length === 0 && (
                            <div className="text-gray-500 text-[10px]">
                                No active controllers
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-3 flex-1 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        ATIS
                    </h3>
                    <div className="space-y-2">
                        {activeSessions
                            .filter(
                                (session) => session.atis && session.atis.text
                            )
                            .map((session) => (
                                <div
                                    key={session.sessionId}
                                    className="text-xs cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors border border-gray-800 hover:border-gray-700"
                                    onClick={() => {
                                        onAtisClick(session);
                                        onClose();
                                    }}
                                    title="Tap to send to terminal"
                                >
                                    <div className="font-bold text-blue-400 text-[11px] mb-0.5">
                                        {session.airportIcao} INFO{' '}
                                        {session.atis?.letter}
                                    </div>
                                    <div className="text-gray-500 text-[9px]">
                                        {session.atis?.timestamp &&
                                            new Date(
                                                session.atis.timestamp
                                            ).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'UTC',
                                                hour12: false,
                                            })}
                                        Z
                                    </div>
                                </div>
                            ))}
                        {activeSessions.filter((s) => s.atis && s.atis.text)
                            .length === 0 && (
                            <div className="text-[10px] text-gray-500">
                                No ATIS available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
