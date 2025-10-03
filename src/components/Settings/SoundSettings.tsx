import { Volume2 } from 'lucide-react';
import { SOUNDS } from '../../utils/playSound';
import type { Settings } from '../../types/settings';
import AudioVisualizerButton from './AudioVisualizerButton';
import { useState } from 'react';

interface SoundSettingsProps {
	settings: Settings | null;
	onChange: (updatedSettings: Settings) => void;
}

const soundConfigs = [
	{
		key: 'startupSound' as const,
		label: 'Session Startup Sound',
		sound: SOUNDS.SESSION_STARTUP
	},
	{
		key: 'chatNotificationSound' as const,
		label: 'Chat Notification Sound',
		sound: SOUNDS.CHAT_NOTIFICATION
	},
	{
		key: 'newStripSound' as const,
		label: 'New Strip Sound',
		sound: SOUNDS.NEW_STRIP
	}
];

export default function SoundSettings({
	settings,
	onChange
}: SoundSettingsProps) {
	const [playingKey, setPlayingKey] = useState<
		keyof Settings['sounds'] | null
	>(null);

	const handleToggle = (soundKey: keyof Settings['sounds']) => {
		if (!settings) return;
		const updatedSettings = {
			...settings,
			sounds: {
				...settings.sounds,
				[soundKey]: {
					...settings.sounds[soundKey],
					enabled: !settings.sounds[soundKey].enabled
				}
			}
		};
		onChange(updatedSettings);
	};

	const handleVolumeChange = (
		soundKey: keyof Settings['sounds'],
		volume: number
	) => {
		if (!settings) return;
		const updatedSettings = {
			...settings,
			sounds: {
				...settings.sounds,
				[soundKey]: {
					...settings.sounds[soundKey],
					volume
				}
			}
		};
		onChange(updatedSettings);
	};

	const handlePlayTest = (soundKey: keyof Settings['sounds']) => {
		const soundSetting = settings?.sounds[soundKey];
		const config = soundConfigs.find((c) => c.key === soundKey);
		if (!soundSetting?.enabled || !config?.sound) return;

		try {
			setPlayingKey(soundKey);
			const audio = new Audio(config.sound);
			audio.volume = soundSetting.volume / 100;
			audio.play();
			audio.onended = () => setPlayingKey(null);
			audio.onerror = () => setPlayingKey(null);
		} catch (error) {
			console.warn('Failed to play test sound:', error);
			setPlayingKey(null);
		}
	};

	if (!settings) return null;

	return (
		<div className="bg-zinc-900 rounded-lg p-4 sm:p-6">
			{/* Header */}
			<div className="flex items-start mb-6">
				<div className="p-2 bg-green-500/10 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
					<Volume2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
				</div>
				<div>
					<h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
						Sound Settings
					</h3>
					<p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
						Enable/disable sounds and adjust their volume. Test them
						to ensure they sound right.
					</p>
				</div>
			</div>

			{/* Sound Controls */}
			<div className="space-y-6">
				{soundConfigs.map(({ key, label }) => {
					const soundSetting = settings.sounds[key];
					return (
						<div
							key={key}
							className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
						>
							<div className="flex-1">
								<h4 className="text-white font-medium text-sm mb-2">
									{label}
								</h4>
								<div className="flex items-center space-x-4">
									{/* Toggle */}
									<label className="flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={soundSetting.enabled}
											onChange={() => handleToggle(key)}
											className="sr-only"
										/>
										<div
											className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
												soundSetting.enabled
													? 'bg-green-500'
													: 'bg-gray-600'
											}`}
										>
											<div
												className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
													soundSetting.enabled
														? 'translate-x-4'
														: 'translate-x-0'
												}`}
											></div>
										</div>
										<span className="ml-2 text-sm text-gray-300">
											{soundSetting.enabled
												? 'Enabled'
												: 'Disabled'}
										</span>
									</label>

									{/* Volume Slider */}
									<div
										className={`flex items-center space-x-2 ${
											!soundSetting.enabled
												? 'opacity-50 pointer-events-none'
												: ''
										}`}
									>
										<span className="text-xs text-gray-400">
											Volume:
										</span>
										<input
											type="range"
											min="10"
											max="200"
											step="10"
											value={soundSetting.volume}
											onChange={(e) =>
												handleVolumeChange(
													key,
													parseInt(e.target.value)
												)
											}
											className="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
										/>
										<span className="text-sm text-white font-medium w-12 text-center">
											{soundSetting.volume}%
										</span>
									</div>
								</div>
							</div>

							<AudioVisualizerButton
								isPlaying={playingKey === key}
								onClick={() => handlePlayTest(key)}
								label="Test"
								variant={
									key === 'startupSound'
										? 'default'
										: key === 'chatNotificationSound'
										? 'notification'
										: key === 'newStripSound'
										? 'newstrip'
										: 'custom'
								}
							/>
						</div>
					);
				})}
			</div>

			{/* Info Section */}
			<div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-lg">
				<div className="flex items-start">
					<div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
					<div>
						<h4 className="text-blue-300 font-medium text-sm mb-1">
							How it works
						</h4>
						<p className="text-blue-200/80 text-xs sm:text-sm leading-relaxed">
							Toggle sounds on/off and adjust volume from 10% to
							200%. Use the "Test" button to preview.
						</p>
					</div>
				</div>
			</div>

			{/* Custom Slider Styles */}
			<style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                }
                .slider::-moz-range-thumb {
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: none;
                }
            `}</style>
		</div>
	);
}
