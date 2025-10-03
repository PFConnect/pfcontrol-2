import Dropdown from '../common/Dropdown';

interface StatusDropdownProps {
	value?: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	size?: 'xs' | 'sm' | 'md' | 'lg';
	placeholder?: string;
	isArrival?: boolean;
}

const departureStatusOptions = [
	{ value: 'PENDING', label: 'PENDING' },
	{ value: 'STUP', label: 'STUP' },
	{ value: 'PUSH', label: 'PUSH' },
	{ value: 'TAXI', label: 'TAXI' },
	{ value: 'RWY', label: 'RWY' },
	{ value: 'DEPA', label: 'DEPA' }
];

const arrivalStatusOptions = [
	{ value: 'DEPA', label: 'DEPA' },
	{ value: 'APPROACH', label: 'APPROACH' },
	{ value: 'RWY', label: 'RWY' },
	{ value: 'TAXI', label: 'TAXI' },
	{ value: 'GATE', label: 'GATE' }
];

const getColorClass = (status: string, isArrival = false) => {
	if (isArrival) {
		switch (status) {
			case 'DEPA':
				return 'text-blue-600';
			case 'APPROACH':
				return 'text-yellow-600';
			case 'RWY':
				return 'text-red-600';
			case 'TAXI':
				return 'text-pink-600';
			case 'GATE':
				return 'text-green-600';
			default:
				return 'text-white';
		}
	} else {
		switch (status) {
			case 'PENDING':
				return 'text-yellow-600';
			case 'STUP':
				return 'text-cyan-600';
			case 'PUSH':
				return 'text-blue-600';
			case 'TAXI':
				return 'text-pink-600';
			case 'RWY':
				return 'text-red-600';
			case 'DEPA':
				return 'text-green-600';
			default:
				return 'text-white';
		}
	}
};

const getBgClass = (status: string) => {
	switch (status) {
		case 'RWY':
			return 'bg-red-600';
		default:
			return '';
	}
};

const getBorderClass = (status: string, isArrival = false) => {
	if (isArrival) {
		switch (status) {
			case 'DEPA':
				return 'border-blue-600';
			case 'APPROACH':
				return 'border-yellow-600';
			case 'RWY':
				return 'border-red-600';
			case 'TAXI':
				return 'border-pink-600';
			case 'GATE':
				return 'border-green-600';
			default:
				return '';
		}
	} else {
		switch (status) {
			case 'PENDING':
				return 'border-yellow-600';
			case 'STUP':
				return 'border-cyan-600';
			case 'PUSH':
				return 'border-blue-600';
			case 'TAXI':
				return 'border-pink-600';
			case 'RWY':
				return 'border-red-600';
			case 'DEPA':
				return 'border-green-600';
			default:
				return '';
		}
	}
};

export default function StatusDropdown({
	value,
	onChange,
	disabled = false,
	size = 'md',
	placeholder = 'Select Status',
	isArrival = false
}: StatusDropdownProps) {
	const statusOptions = isArrival
		? arrivalStatusOptions
		: departureStatusOptions;

	const renderOption = (option: { value: string; label: string }) => (
		<span className={getColorClass(option.value, isArrival)}>
			{option.label}
		</span>
	);

	const getDisplayValue = (selectedValue: string) => {
		if (!selectedValue) return placeholder;
		return selectedValue;
	};

	const bgClass = value ? getBgClass(value) : '';
	const borderClass = value ? getBorderClass(value, isArrival) : '';
	const textClass = value ? 'text-white' : '';

	return (
		<Dropdown
			options={statusOptions}
			value={value}
			onChange={onChange}
			disabled={disabled}
			size={size}
			placeholder={placeholder}
			renderOption={renderOption}
			getDisplayValue={getDisplayValue}
			className={`${bgClass} ${borderClass} ${textClass} font-bold`}
		/>
	);
}
