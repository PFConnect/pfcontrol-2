import { UserIcon, Radio } from 'lucide-react';
import type { OverviewSession } from '../../sockets/overviewSocket';
import type { User } from '../../types/user';

interface AcarsSidebarProps {
    activeSessions: OverviewSession[];
    user: User;
    onAtisClick: (session: OverviewSession) => void;
}

export default function AcarsSidebar({
    activeSessions,
    user,
    onAtisClick,
}: AcarsSidebarProps) {
    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-800">
                <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    CONTROLLERS
                </h3>
                <div className="space-y-2 text-xs">
                    {activeSessions.map((session) => (
                        <div key={session.sessionId} className="text-gray-300">
                            <div className="font-semibold text-cyan-400 text-xs">
                                {session.airportIcao}
                            </div>
                            {session.controllers &&
                            session.controllers.length > 0 ? (
                                <div className="ml-2 mt-1 space-y-1">
                                    {session.controllers.map(
                                        (controller, idx) => {
                                            const isCurrentUser =
                                                !!user &&
                                                controller.username ===
                                                    user.username;
                                            const isVatsimLinked =
                                                isCurrentUser &&
                                                !!user?.vatsimCid;
                                            const hasControllerRating =
                                                isVatsimLinked &&
                                                !!user?.vatsimRatingShort &&
                                                user.vatsimRatingShort !==
                                                    'OBS' &&
                                                user.vatsimRatingShort !==
                                                    'SUS';
                                            return (
                                                <div key={idx} className="">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-base">
                                                            •
                                                        </span>
                                                        <a
                                                            className="text-white text-base md:text-lg font-semibold"
                                                            href={`${window.location.origin}/pilots/${controller.username}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {
                                                                controller.username
                                                            }
                                                        </a>
                                                        {isVatsimLinked &&
                                                            hasControllerRating && (
                                                                <span className="relative group inline-flex items-center justify-center rounded-full bg-white p-0.5">
                                                                    <img
                                                                        src="/assets/images/vatsim.webp"
                                                                        alt="VATSIM"
                                                                        className="h-3 w-3"
                                                                    />
                                                                    <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] md:text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-green-500 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-100">
                                                                        <span className="font-bold">
                                                                            {
                                                                                user.vatsimRatingShort
                                                                            }
                                                                        </span>{' '}
                                                                        | This
                                                                        user
                                                                        holds a
                                                                        controller
                                                                        rating
                                                                        on
                                                                        VATSIM
                                                                    </span>
                                                                </span>
                                                            )}
                                                        <span className="text-gray-500 text-sm md:text-base">
                                                            ({controller.role})
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
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
                        .filter((session) => session.atis && session.atis.text)
                        .map((session) => (
                            <div
                                key={session.sessionId}
                                className="text-xs cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors border border-gray-800 hover:border-gray-700"
                                onDoubleClick={() => onAtisClick(session)}
                                title="Double-click to send to terminal"
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
    );
}
