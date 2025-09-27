import { useState } from 'react';
import { Info, MessageCircle, Settings } from 'lucide-react';
import type { Position } from '../../types/session';
import WindDisplay from './WindDisplay';
import Button from '../common/Button';
import RunwayDropdown from '../dropdowns/RunwayDropdown';
import Dropdown from '../common/Dropdown';

interface ToolbarProps {
	icao: string | null;
}

export default function Toolbar({ icao }: ToolbarProps) {
	const [runway, setRunway] = useState('');
	const [position, setPosition] = useState<Position | null>(null);

	const handleRunwayChange = (selectedRunway: string) => {
		setRunway(selectedRunway);
	};

	const handlePositionChange = (selectedPosition: string) => {
		setPosition(selectedPosition as Position);
	};

	return (
		<div className="flex items-center justify-between w-full px-4 py-2">
			<div className="flex items-center gap-4">
				<WindDisplay icao={icao} size="small" />
			</div>
			<div className="flex items-center gap-4">
				<Dropdown
					options={[
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
				>
					<MessageCircle className="w-5 h-5" />
					<span className="hidden sm:inline font-medium">Chat</span>
				</Button>

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
