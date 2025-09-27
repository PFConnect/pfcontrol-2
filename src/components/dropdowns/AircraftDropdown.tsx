import { useEffect, useState } from 'react';
import Dropdown from '../common/Dropdown';
import type { Aircraft } from '../../types/aircraft';

interface AircraftDropdownProps {
	value?: string;
	onChange: (aircraftType: string) => void;
	disabled?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

export default function AircraftDropdown({
	value,
	onChange,
	disabled = false,
	size = 'md'
}: AircraftDropdownProps) {
	const [aircraftList, setAircraftList] = useState<
		{ type: string; name: string }[]
	>([]);

	useEffect(() => {
		async function loadAircraft() {
			const res = await fetch('/server/data/aircraftData.json');
			const data = await res.json();
			const list = Object.entries(data).map(([type, info]) => ({
				type,
				name: (info as Aircraft).name
			}));
			setAircraftList(list);
		}
		loadAircraft();
	}, []);

	const dropdownOptions = aircraftList.map((ac) => ({
		value: ac.type,
		label: `${ac.type} - ${ac.name}`
	}));

	const getDisplayValue = (selectedValue: string) => {
		if (!selectedValue) return 'Select Aircraft';
		const found = aircraftList.find((ac) => ac.type === selectedValue);
		return found ? `${found.type} - ${found.name}` : selectedValue;
	};

	return (
		<Dropdown
			options={dropdownOptions}
			placeholder="Select Aircraft"
			value={value}
			onChange={onChange}
			disabled={disabled}
			getDisplayValue={getDisplayValue}
			size={size}
		/>
	);
}
