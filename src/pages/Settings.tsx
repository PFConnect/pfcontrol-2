import { useEffect, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/common/Button';
import { fetchUserSettings } from '../utils/fetch/settings';
import type { Settings } from '../types/settings';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export default function Settings() {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState('');
	const [dragActive, setDragActive] = useState(false);

	useEffect(() => {
		loadSettings();
	}, []);

	const loadSettings = async () => {
		try {
			const data = await fetchUserSettings();
			setSettings(data);
		} catch {
			setError('Failed to load settings');
		} finally {
			setLoading(false);
		}
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
			await loadSettings();
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
			await loadSettings();
		} catch {
			setError('Failed to delete image');
		} finally {
			setDeleting(false);
		}
	};

	if (loading)
		return (
			<div className="min-h-screen bg-gradient-to-t from-black via-zinc-900 to-blue-950 text-white flex items-center justify-center">
				<Navbar />
				<div className="text-xl">Loading...</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-gradient-to-t from-black via-zinc-900 to-blue-950 text-white">
			<Navbar />
			<div className="max-w-4xl mx-auto px-4 py-8 pt-24">
				<h1
					className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-blue-400 to-blue-900 bg-clip-text text-transparent mb-8 text-center"
					style={{ lineHeight: 1.5 }}
				>
					Settings
				</h1>
				<div className="w-16 h-1 bg-blue-500 mx-auto mb-12"></div>

				{error && (
					<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6 flex items-center">
						<X className="h-5 w-5 text-red-500 mr-3" />
						<p className="text-red-300">{error}</p>
					</div>
				)}

				{/* Background Image Section */}
				<div className="bg-zinc-900 border-2 border-blue-800 rounded-2xl p-8 mb-6 shadow-xl">
					<h2 className="text-2xl font-semibold mb-6 flex items-center text-blue-200">
						<ImageIcon className="mr-3 h-6 w-6" />
						Background Image
					</h2>
					{settings?.backgroundImage?.selectedImage ? (
						<div className="mb-4 flex flex-col items-center">
							<div className="relative w-full max-w-2xl h-64 rounded-xl overflow-hidden shadow-lg border-2 border-blue-700/60">
								<img
									src={settings.backgroundImage.selectedImage}
									alt="Current background"
									className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
								/>
								{/* Overlay with floating delete button */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-100 flex items-end justify-end p-2">
									<Button
										onClick={handleDelete}
										disabled={deleting}
										variant="danger"
										className="flex items-center space-x-2 shadow-lg bg-red-700/90 hover:bg-red-800/90 transition-colors px-3 py-1.5 text-sm"
									>
										<Trash2 className="h-4 w-4" />
										<span>
											{deleting
												? 'Deleting...'
												: 'Delete'}
										</span>
									</Button>
								</div>
							</div>
						</div>
					) : (
						<p className="text-gray-400 mb-6 text-left">
							No custom background set. Upload an image to
							personalize your experience.
						</p>
					)}
					{!settings?.backgroundImage?.selectedImage ? (
						<div
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							className={`
                            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
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
									className={`
                                p-4 rounded-full transition-colors duration-300
                                ${dragActive ? 'bg-blue-600' : 'bg-blue-800'}
                            `}
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
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
										<span>Uploading...</span>
									</div>
								)}
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
