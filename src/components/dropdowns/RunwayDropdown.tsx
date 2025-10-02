// src/components/dropdowns/RunwayDropdown.tsx
import { useEffect, useState } from 'react';
import { fetchRunways } from '../../utils/fetch/data';
import Dropdown from '../common/Dropdown';

interface RunwayDropdownProps {
	airportIcao: string;
	onChange: (runway: string) => void;
	value?: string;
	disabled?: boolean;
	size?: 'xs' | 'sm' | 'md' | 'lg';
	placeholder?: string;
}

export default function RunwayDropdown({
	airportIcao,
	onChange,
	value,
	disabled = false,
	size = 'md',
	placeholder = 'Select Runway'
}: RunwayDropdownProps) {
	const [runways, setRunways] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		async function loadRunways() {
			if (!airportIcao) {
				setRunways([]);
				return;
			}

			setIsLoading(true);
			try {
				const data = await fetchRunways(airportIcao);
				setRunways(data || []);
			} catch (error) {
				console.error('Error fetching runways:', error);
				setRunways([]);
			} finally {
				setIsLoading(false);
			}
		}

		loadRunways();
	}, [airportIcao]);

	const dropdownOptions = runways.map((runway) => ({
		value: runway,
		label: runway
	}));

	const getDisplayValue = (selectedValue: string) => {
		if (!selectedValue) {
			if (!airportIcao) return 'Select Airport First';
			if (isLoading) return 'Loading runways...';
			if (runways.length === 0) return 'No runways available';
			return placeholder;
		}
		return selectedValue;
	};

	return (
		<Dropdown
			options={dropdownOptions}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			disabled={
				disabled || !airportIcao || isLoading || runways.length === 0
			}
			getDisplayValue={getDisplayValue}
			size={size}
		/>
	);
}
