import { useState } from 'react';
import { Info, MessageCircle, Settings } from 'lucide-react';
import type { Position } from '../../types/session';
import WindDisplay from './WindDisplay';
import Button from '../common/Button';
import RunwayDropdown from '../dropdowns/RunwayDropdown';
import Dropdown from '../common/Dropdown';
import FrequencyDisplay from './FrequencyDisplay';
import ChatSidebar from './ChatSidebar';

interface ToolbarProps {
	sessionId?: string;
	accessId?: string;
	icao: string | null;
}

export default function Toolbar({ icao, sessionId, accessId }: ToolbarProps) {
	const [runway, setRunway] = useState('');
	const [position, setPosition] = useState<Position | null>(null);
	const [chatOpen, setChatOpen] = useState(false);

	const handleRunwayChange = (selectedRunway: string) => {
		setRunway(selectedRunway);
	};

	const handlePositionChange = (selectedPosition: string) => {
		setPosition(selectedPosition as Position);
	};

	return (
		<div
			className="
                toolbar
                flex items-center justify-between w-full px-4 py-2
                gap-2
                lg:flex-row lg:gap-4 lg:items-center
                md:flex-col md:items-start md:gap-3
                sm:flex-col sm:items-start sm:gap-2
            "
		>
			<div
				className="
					wind-frequency-group
					flex items-center gap-4
					lg:gap-4
					md:gap-3
					sm:gap-2
				"
			>
				<WindDisplay icao={icao} size="small" />
				<FrequencyDisplay airportIcao={icao ?? ''} />
			</div>
			<div
				className="
					flex items-center gap-4
					lg:gap-4
					md:gap-3
					sm:gap-2
					flex-wrap
				"
			>
				<Dropdown
					options={[
						{ value: 'ALL', label: 'All' },
						{ value: 'DEL', label: 'Delivery' },
						{ value: 'GND', label: 'Ground' },
						{ value: 'TWR', label: 'Tower' },
						{ value: 'APP', label: 'Approach' }
					]}
					value={position || ''}
					onChange={handlePositionChange}
					placeholder="Select Position"
					disabled={!icao}
					size="sm"
					className="min-w-[100px]"
				/>

				<RunwayDropdown
					airportIcao={icao ?? ''}
					onChange={handleRunwayChange}
					value={runway}
					size="sm"
				/>

				<Button
					className="flex items-center gap-2 px-4 py-2"
					aria-label="Settings"
					size="sm"
					variant="outline"
				>
					<Info className="w-5 h-5" />
					<span className="hidden sm:inline font-medium">ATIS</span>
				</Button>

				<Button
					className="flex items-center gap-2 px-4 py-2"
					aria-label="Settings"
					size="sm"
					onClick={() => setChatOpen(!chatOpen)}
				>
					<MessageCircle className="w-5 h-5" />
					<span className="hidden sm:inline font-medium">Chat</span>
				</Button>

				<ChatSidebar
					sessionId={sessionId ?? ''}
					accessId={accessId ?? ''}
					open={chatOpen}
					onClose={() => setChatOpen(false)}
				/>

				<Button
					className="flex items-center gap-2 px-4 py-2"
					aria-label="Settings"
					size="sm"
				>
					<Settings className="w-5 h-5" />
					<span className="hidden sm:inline font-medium">
						Settings
					</span>
				</Button>
			</div>
		</div>
	);
}
