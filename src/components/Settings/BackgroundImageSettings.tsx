import { useEffect, useState } from 'react';
import {
	Upload,
	Trash2,
	Image as ImageIcon,
	X,
	Eye,
	EyeOff,
	Star,
	Shuffle,
	User,
	Loader2
} from 'lucide-react';
import Button from '../common/Button';
import { fetchBackgrounds } from '../../utils/fetch/data';
import type { Settings } from '../../types/settings';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

interface AvailableImage {
	filename: string;
	path: string;
	extension: string;
}

interface BackgroundImageSettingsProps {
	settings: Settings | null;
	onChange: (updatedSettings: Settings) => void;
}

export default function BackgroundImageSettings({
	settings,
	onChange
}: BackgroundImageSettingsProps) {
	const [availableImages, setAvailableImages] = useState<AvailableImage[]>(
		[]
	);
	const [loadingImages, setLoadingImages] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState('');
	const [dragActive, setDragActive] = useState(false);
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>(
		{}
	);

	useEffect(() => {
		loadAvailableImages();
	}, []);

	const loadAvailableImages = async () => {
		try {
			setLoadingImages(true);
			const data = await fetchBackgrounds();
			setAvailableImages(data);
		} catch (error) {
			console.error('Error loading available images:', error);
			setError('Failed to load background images');
		} finally {
			setLoadingImages(false);
		}
	};

	const handleSelectImage = (imageUrl: string) => {
		if (!settings) return;

		let selectedValue: string | null = imageUrl;
		if (imageUrl === '') {
			selectedValue = null;
		}

		const isUserUploaded = selectedValue && getPhotoCredit(selectedValue);

		const updatedSettings = {
			...settings,
			backgroundImage: {
				...settings.backgroundImage,
				selectedImage: selectedValue,
				useCustomBackground: !!isUserUploaded
			}
		};
		onChange(updatedSettings);
	};

	const handleToggleFavorite = (filename: string) => {
		if (!settings) return;

		const currentFavorites = settings.backgroundImage?.favorites || [];
		const isFavorite = currentFavorites.includes(filename);

		const newFavorites = isFavorite
			? currentFavorites.filter((f) => f !== filename)
			: [...currentFavorites, filename];

		const updatedSettings = {
			...settings,
			backgroundImage: {
				...settings.backgroundImage,
				favorites: newFavorites
			}
		};
		onChange(updatedSettings);
	};

	const handleFile = async (file: File) => {
		if (!file.type.startsWith('image/')) {
			setError('Please select a valid image file');
			return;
		}

		const formData = new FormData();
		formData.append('image', file);

		setUploading(true);
		setError('');

		try {
			const res = await fetch(
				`${API_BASE_URL}/api/uploads/upload-background`,
				{
					method: 'POST',
					credentials: 'include',
					body: formData
				}
			);
			if (!res.ok) throw new Error('Upload failed');
			await loadAvailableImages();
		} catch {
			setError('Failed to upload image');
		} finally {
			setUploading(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragActive(false);
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFile(file);
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		setError('');
		try {
			const res = await fetch(
				`${API_BASE_URL}/api/uploads/delete-background`,
				{
					method: 'DELETE',
					credentials: 'include'
				}
			);
			if (!res.ok) throw new Error('Delete failed');
			await loadAvailableImages();
		} catch {
			setError('Failed to delete image');
		} finally {
			setDeleting(false);
		}
	};

	const handleImageLoad = (imagePath: string) => {
		setLoadedImages((prev) => ({
			...prev,
			[imagePath]: true
		}));
	};

	const getPhotoCredit = (filename: string): string | null => {
		if (!filename) return null;
		if (filename.match(/^[A-Z]{4}\.(png|jpg|jpeg)$/i)) {
			return null;
		}
		const match = filename.match(/^(.+?)__\d{3}\.(png|jpg|jpeg)$/i);
		if (match) {
			return match[1];
		}
		return null;
	};

	const getImageUrl = (filename: string | null): string | null => {
		if (!filename || filename === 'random' || filename === 'favorites') {
			return filename;
		}
		return `${API_BASE_URL}/assets/app/backgrounds/${filename}`;
	};

	const favoriteCount = (settings?.backgroundImage?.favorites || []).length;
	const selectedImage = settings?.backgroundImage?.selectedImage;

	return (
		<div className="bg-zinc-900 rounded-lg p-4 sm:p-6">
			{/* Header */}
			<div className="flex items-start mb-6">
				<div className="p-2 bg-green-500/10 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
					<ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
				</div>
				<div>
					<h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
						Background Images
					</h3>
					<p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
						Choose from available backgrounds or upload your own
						custom image.
					</p>
				</div>
			</div>

			{error && (
				<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6 flex items-center">
					<X className="h-5 w-5 text-red-500 mr-3" />
					<p className="text-red-300">{error}</p>
					<button
						onClick={() => setError('')}
						className="ml-auto text-red-400 hover:text-red-300"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Current Background Display - Only show for user-uploaded images */}
			{settings?.backgroundImage?.selectedImage &&
				!['random', 'favorites'].includes(
					settings.backgroundImage.selectedImage
				) &&
				settings.backgroundImage.selectedImage !== null &&
				getPhotoCredit(settings.backgroundImage.selectedImage) && ( // Added check for user-uploaded
					<div className="mb-6">
						<h4 className="text-white font-semibold text-sm mb-3">
							Current Background
						</h4>
						<div className="relative w-full max-w-2xl h-64 rounded-xl overflow-hidden shadow-lg border-2 border-blue-700/60">
							<img
								src={
									getImageUrl(
										settings.backgroundImage.selectedImage
									) ?? undefined
								}
								alt="Current background"
								className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-100 flex items-end justify-end p-2">
								<Button
									onClick={handleDelete}
									disabled={deleting}
									variant="danger"
									className="flex items-center space-x-2 shadow-lg bg-red-700/90 hover:bg-red-800/90 transition-colors px-3 py-1.5 text-sm"
								>
									<Trash2 className="h-4 w-4" />
									<span>
										{deleting ? 'Deleting...' : 'Delete'}
									</span>
								</Button>
							</div>
						</div>
					</div>
				)}

			{/* Upload Section - Hide if custom background is active */}
			{!settings?.backgroundImage?.useCustomBackground && (
				<div className="mb-6">
					<h4 className="text-white font-semibold text-sm mb-3">
						Upload Custom Background
					</h4>
					<div
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                            ${
								dragActive
									? 'border-blue-400 bg-blue-900/20 scale-[1.02]'
									: 'border-blue-600/50 bg-blue-900/10 hover:border-blue-500 hover:bg-blue-900/15'
							}
                        `}
					>
						<input
							type="file"
							accept="image/*"
							onChange={handleFileInput}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							disabled={uploading}
						/>
						<div className="flex flex-col items-center space-y-4">
							<div
								className={`p-4 rounded-full transition-colors duration-300 ${
									dragActive ? 'bg-blue-600' : 'bg-blue-800'
								}`}
							>
								<Upload className="h-8 w-8 text-white" />
							</div>
							<div>
								<p className="text-xl font-semibold text-white mb-2">
									{dragActive
										? 'Drop your image here'
										: 'Upload Background Image'}
								</p>
								<p className="text-gray-400">
									Drag and drop an image here, or click to
									browse
								</p>
								<p className="text-sm text-gray-500 mt-2">
									Supports: JPG, PNG, GIF (Max 10MB)
								</p>
							</div>
							{uploading && (
								<div className="flex items-center space-x-2 text-blue-400">
									<Loader2 className="animate-spin rounded-full h-4 w-4" />
									<span>Uploading...</span>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Available Backgrounds */}
			<div className="space-y-4">
				<h4 className="text-white font-semibold text-sm">
					Available Backgrounds
				</h4>
				{loadingImages ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
						<span className="text-gray-400">
							Loading available images...
						</span>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{/* No Background Option */}
						<div
							className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2 ${
								selectedImage === null || selectedImage === ''
									? 'border-blue-500 shadow-lg shadow-blue-500/25'
									: 'border-gray-700 hover:border-gray-600'
							}`}
							onClick={() => handleSelectImage('')}
						>
							<div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
								<div className="text-center">
									<EyeOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
									<span className="text-gray-400 text-xs">
										No Background
									</span>
								</div>
							</div>
						</div>

						{/* Random Option */}
						<div
							className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2 ${
								selectedImage === 'random'
									? 'border-purple-500 shadow-lg shadow-purple-500/25'
									: 'border-gray-700 hover:border-gray-600'
							}`}
							onClick={() => handleSelectImage('random')}
						>
							<div className="aspect-video bg-gradient-to-br from-purple-800 to-purple-900 flex items-center justify-center">
								<div className="text-center">
									<Shuffle className="h-8 w-8 text-purple-400 mx-auto mb-2" />
									<span className="text-purple-400 text-xs">
										Random
									</span>
								</div>
							</div>
						</div>

						{/* Favorites Option */}
						<div
							className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2 ${
								selectedImage === 'favorites'
									? 'border-yellow-500 shadow-lg shadow-yellow-500/25'
									: favoriteCount === 0
									? 'border-gray-600 opacity-50 cursor-not-allowed'
									: 'border-gray-700 hover:border-gray-600'
							}`}
							onClick={() =>
								favoriteCount > 0 &&
								handleSelectImage('favorites')
							}
						>
							<div className="aspect-video bg-gradient-to-br from-yellow-800 to-yellow-900 flex items-center justify-center">
								<div className="text-center">
									<Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
									<span className="text-yellow-400 text-xs">
										Favorites ({favoriteCount})
									</span>
								</div>
							</div>
						</div>

						{/* Available Images */}
						{availableImages.map((image, index) => {
							const photoCredit = getPhotoCredit(image.filename);
							const isImageLoaded = loadedImages[image.path];
							const fullImageUrl = `${API_BASE_URL}${image.path}`;
							const isFavorite = (
								settings?.backgroundImage?.favorites || []
							).includes(image.filename);
							const isSelected =
								settings?.backgroundImage?.selectedImage ===
								image.filename;

							return (
								<div
									key={index}
									className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2 group ${
										isSelected
											? 'border-green-500 shadow-lg shadow-green-500/25'
											: 'border-gray-700 hover:border-gray-600'
									}`}
								>
									<div
										className="aspect-video relative"
										onClick={() =>
											handleSelectImage(image.filename)
										} // Save filename
									>
										{!isImageLoaded && (
											<div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
												<div className="absolute inset-0 skeleton-loading"></div>
											</div>
										)}
										<img
											src={fullImageUrl}
											alt={`Background option ${
												index + 1
											}`}
											className={`w-full h-full object-cover transition-opacity duration-300 ${
												isImageLoaded
													? 'opacity-100'
													: 'opacity-0'
											}`}
											loading="lazy"
											onLoad={() =>
												handleImageLoad(image.path)
											}
										/>
										{isSelected && (
											<div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
												<Eye className="h-3 w-3 text-white" />
											</div>
										)}
										<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleToggleFavorite(
												image.filename
											);
										}}
										className={`absolute top-2 left-2 p-1 rounded-full transition-colors ${
											isFavorite
												? 'bg-yellow-500 text-white'
												: 'bg-black/50 text-gray-300 hover:text-yellow-400'
										}`}
									>
										<Star
											className={`h-3 w-3 ${
												isFavorite ? 'fill-current' : ''
											}`}
										/>
									</button>
									{photoCredit && isImageLoaded && (
										<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
											<div className="flex items-center text-xs text-white">
												<User className="h-3 w-3 mr-1" />
												<span>@{photoCredit}</span>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
				{availableImages.length === 0 && !loadingImages && (
					<div className="text-center p-8 text-gray-400">
						<ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>No background images available yet.</p>
						<p className="text-xs mt-2">
							Upload your own image or wait for images to be
							added.
						</p>
					</div>
				)}
			</div>

			{/* Info section */}
			<div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-lg">
				<div className="flex items-start">
					<div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
					<div>
						<h4 className="text-blue-300 font-medium text-sm mb-1">
							How it works
						</h4>
						<p className="text-blue-200/80 text-xs sm:text-sm leading-relaxed">
							Select "No Background" for the default transparent
							background, "Random" for any available image each
							session, "Favorites" for random selection from your
							starred images only, or choose a specific image.
							Click the star to add/remove favorites. Remember to
							save your changes!
						</p>
					</div>
				</div>
			</div>

			<style>{`
                @keyframes skeletonPulse {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .skeleton-loading {
                    background: linear-gradient(110deg, rgba(55, 65, 81, 0.5) 8%, rgba(75, 85, 99, 0.8) 18%, rgba(55, 65, 81, 0.5) 33%);
                    background-size: 200% 100%;
                    animation: skeletonPulse 1.5s ease-in-out infinite;
                }
            `}</style>
		</div>
	);
}
