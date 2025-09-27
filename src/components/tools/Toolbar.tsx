import { useEffect } from 'react';
import { Info, MessageCircle, Settings, PlaneTakeoff } from 'lucide-react';
import { fetchRunways } from '../../utils/fetch/data';
import WindDisplay from './WindDisplay';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';

interface ToolbarProps {
	icao: string | null;
}

export default function Toolbar({ icao }: ToolbarProps) {
	useEffect(() => {
		if (!icao) return;

		fetchRunways(icao);
	}, [icao]);

	return (
		<div className="flex items-center justify-between w-full px-4 py-2">
			<div>
				<WindDisplay icao={icao} size="small" />
			</div>
			<div className="flex items-center gap-4">
				<Dropdown
					className="flex items-center gap-2 px-4 py-2"
					aria-label="Settings"
					size="sm"
					variant="outline"
				>
					<PlaneTakeoff className="w-5 h-5" />
					<span className="hidden sm:inline font-medium">Runway</span>
				</Dropdown>

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
