import { useEffect, useState, useRef, useContext } from 'react';
import { UNSAFE_NavigationContext, useLocation } from 'react-router-dom';
import { fetchUserSettings, updateUserSettings } from '../utils/fetch/settings';
import { Save, AlertTriangle } from 'lucide-react';
import type { Settings } from '../types/settings';
import BackgroundImageSettings from '../components/Settings/BackgroundImageSettings';
import SoundSettings from '../components/Settings/SoundSettings';
import Navbar from '../components/Navbar';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

function useCustomBlocker(shouldBlock: boolean, onBlock: () => void) {
	const navigator = useContext(UNSAFE_NavigationContext)?.navigator;
	const location = useLocation();

	useEffect(() => {
		if (!shouldBlock || !navigator) return;

		const push = navigator.push;
		const replace = navigator.replace;

		const block = () => {
			onBlock();
		};

		navigator.push = () => {
			block();
		};
		navigator.replace = () => {
			block();
		};

		return () => {
			navigator.push = push;
			navigator.replace = replace;
		};
	}, [shouldBlock, onBlock, navigator, location]);
}

export default function Settings() {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [localSettings, setLocalSettings] = useState<Settings | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [showDiscardToast, setShowDiscardToast] = useState(false);
	const preventNavigation = useRef(false);

	useEffect(() => {
		loadSettings();
	}, []);

	useEffect(() => {
		if (settings && localSettings) {
			const hasChanges =
				JSON.stringify(settings) !== JSON.stringify(localSettings);
			setHasChanges(hasChanges);
			preventNavigation.current = hasChanges;
		}
	}, [settings, localSettings]);

	useCustomBlocker(hasChanges, () => setShowDiscardToast(true));

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () =>
			window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasChanges]);

	const loadSettings = async () => {
		try {
			const data = await fetchUserSettings();

			const completeSettings = {
				...data,
				backgroundImage: {
					selectedImage: data.backgroundImage?.selectedImage || null,
					useCustomBackground:
						data.backgroundImage?.useCustomBackground || false,
					favorites: data.backgroundImage?.favorites || [],
					stripOpacity: data.backgroundImage?.stripOpacity || 100
				},
				sounds: {
					startupSound: data.sounds?.startupSound || {
						enabled: true,
						volume: 100
					},
					chatNotificationSound: data.sounds
						?.chatNotificationSound || {
						enabled: true,
						volume: 100
					},
					newStripSound: data.sounds?.newStripSound || {
						enabled: true,
						volume: 100
					}
				}
			};

			console.log('Loaded settings:', completeSettings);
			setSettings(completeSettings);
			setLocalSettings(completeSettings);
		} catch (error) {
			console.error('Error fetching user settings:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleLocalSettingsChange = (updatedSettings: Settings) => {
		setLocalSettings(updatedSettings);
	};

	const handleSave = async () => {
		if (!localSettings) return;

		try {
			setSaving(true);
			await updateUserSettings(localSettings);
			setSettings(localSettings);
			setHasChanges(false);
			preventNavigation.current = false;
		} catch (error) {
			console.error('Error updating settings:', error);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = () => {
		if (settings) {
			setLocalSettings(settings);
			setHasChanges(false);
			preventNavigation.current = false;
			setShowDiscardToast(false);
		}
	};

	const handleForceLeave = () => {
		preventNavigation.current = false;
		setShowDiscardToast(false);
		window.history.back();
	};

	if (loading)
		return (
			<div className="min-h-screen bg-gradient-to-t from-black via-zinc-900 to-blue-950 text-white flex items-center justify-center">
				<Navbar />
				<Loader />
			</div>
		);

	return (
		<div className="min-h-screen bg-zinc-900 text-white">
			<Navbar />
			<div className="max-w-6xl mx-auto px-4 py-8 pt-24">
				<h1
					className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-blue-400 to-blue-900 bg-clip-text text-transparent mb-8 text-left"
					style={{ lineHeight: 1.5 }}
				>
					Settings
				</h1>
				<SoundSettings
					settings={localSettings}
					onChange={handleLocalSettingsChange}
				/>
				<div className="mt-8">
					<BackgroundImageSettings
						settings={localSettings}
						onChange={handleLocalSettingsChange}
					/>
				</div>
			</div>

			{hasChanges && !showDiscardToast && (
				<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
					<div className="bg-blue-900/95 backdrop-blur-sm border border-blue-600/50 rounded-2xl p-6 shadow-xl flex items-center space-x-4 min-w-[320px]">
						<div className="flex-1">
							<p className="text-white font-medium text-sm">
								You have unsaved changes
							</p>
							<p className="text-blue-300 text-xs">
								Don't forget to save your settings
							</p>
						</div>
						<div className="flex space-x-3">
							<Button
								onClick={handleDiscard}
								variant="outline"
								size="sm"
								disabled={saving}
								className="text-xs text-white border-white hover:bg-white/20"
							>
								Discard
							</Button>
							<Button
								onClick={handleSave}
								disabled={saving}
								size="sm"
								className="text-xs flex items-center space-x-1"
							>
								{saving ? (
									<>
										<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
										<span>Saving...</span>
									</>
								) : (
									<>
										<Save className="w-3 h-3" />
										<span>Save</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Discard Warning Toast */}
			{showDiscardToast && (
				<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
					<div className="bg-red-900/95 backdrop-blur-sm border border-red-600/50 rounded-2xl p-6 shadow-xl flex items-center space-x-4 min-w-[380px]">
						<AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
						<div className="flex-1">
							<p className="text-white font-medium text-sm">
								Unsaved changes will be lost
							</p>
							<p className="text-red-300 text-xs">
								Are you sure you want to leave without saving?
							</p>
						</div>
						<div className="flex space-x-3">
							<Button
								onClick={() => setShowDiscardToast(false)}
								variant="outline"
								size="sm"
								className="text-xs border-white text-white hover:bg-white/20"
							>
								Cancel
							</Button>
							<Button
								onClick={handleForceLeave}
								variant="danger"
								size="sm"
								className="text-xs"
							>
								Leave anyway
							</Button>
						</div>
					</div>
				</div>
			)}

			<style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .fixed.bottom-6 > div {
                    left: 50%;
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
		</div>
	);
}
