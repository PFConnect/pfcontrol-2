import { useState, useEffect } from 'react';
import { Shield, Users, Activity, Database, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Loader from '../components/common/Loader';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import ProtectedRoute from '../components/ProtectedRoute';
import {
	fetchAdminStatistics,
	type AdminStats,
	type DailyStats
} from '../utils/fetch/admin';
import Button from '../components/common/Button';

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	Filler
);

export default function Admin() {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [timeRange, setTimeRange] = useState(30);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchStats();
	}, [timeRange]);

	const fetchStats = async () => {
		try {
			setLoading(true);
			setError(null);

			const data = await fetchAdminStatistics(timeRange);
			setStats(data);
		} catch (error) {
			console.error('Error fetching admin statistics:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Failed to fetch statistics'
			);
		} finally {
			setLoading(false);
		}
	};

	const formatChartData = (daily: DailyStats[]) => {
		const labels = daily.map((item) =>
			new Date(item.date).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			})
		);

		return {
			labels,
			datasets: [
				{
					label: 'Logins',
					data: daily.map((item) => item.logins_count),
					borderColor: '#3B82F6',
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#3B82F6',
					pointBorderColor: '#1E40AF',
					pointHoverBackgroundColor: '#60A5FA',
					pointHoverBorderColor: '#1E40AF',
					pointRadius: 4,
					pointHoverRadius: 6
				},
				{
					label: 'Sessions',
					data: daily.map((item) => item.new_sessions_count),
					borderColor: '#10B981',
					backgroundColor: 'rgba(16, 185, 129, 0.1)',
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#10B981',
					pointBorderColor: '#047857',
					pointHoverBackgroundColor: '#34D399',
					pointHoverBorderColor: '#047857',
					pointRadius: 4,
					pointHoverRadius: 6
				},
				{
					label: 'Flights',
					data: daily.map((item) => item.new_flights_count),
					borderColor: '#8B5CF6',
					backgroundColor: 'rgba(139, 92, 246, 0.1)',
					fill: true,
					tension: 0.4,
					pointBackgroundColor: '#8B5CF6',
					pointBorderColor: '#7C3AED',
					pointHoverBackgroundColor: '#A78BFA',
					pointHoverBorderColor: '#7C3AED',
					pointRadius: 4,
					pointHoverRadius: 6
				}
			]
		};
	};

	const formatBarChartData = (daily: DailyStats[]) => {
		return {
			labels: daily.map((item) =>
				new Date(item.date).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric'
				})
			),
			datasets: [
				{
					label: 'New Users',
					data: daily.map((item) => item.new_users_count),
					backgroundColor: 'rgba(245, 158, 11, 0.8)',
					borderColor: '#F59E0B',
					borderWidth: 2,
					borderRadius: 6,
					borderSkipped: false
				}
			]
		};
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const,
				labels: {
					color: '#D1D5DB',
					font: {
						size: 12,
						weight: 500
					},
					usePointStyle: true,
					pointStyle: 'circle'
				}
			},
			tooltip: {
				backgroundColor: 'rgba(17, 24, 39, 0.95)',
				titleColor: '#F9FAFB',
				bodyColor: '#D1D5DB',
				borderColor: '#374151',
				borderWidth: 1,
				cornerRadius: 8,
				displayColors: true,
				mode: 'index' as const,
				intersect: false
			}
		},
		scales: {
			x: {
				grid: {
					color: 'rgba(55, 65, 81, 0.3)',
					drawBorder: false
				},
				ticks: {
					color: '#9CA3AF',
					font: {
						size: 11
					}
				}
			},
			y: {
				grid: {
					color: 'rgba(55, 65, 81, 0.3)',
					drawBorder: false
				},
				ticks: {
					color: '#9CA3AF',
					font: {
						size: 11
					}
				}
			}
		},
		interaction: {
			mode: 'index' as const,
			intersect: false
		},
		elements: {
			line: {
				borderWidth: 3
			}
		}
	};

	const barChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const,
				labels: {
					color: '#D1D5DB',
					font: {
						size: 12,
						weight: 500
					}
				}
			},
			tooltip: {
				backgroundColor: 'rgba(17, 24, 39, 0.95)',
				titleColor: '#F9FAFB',
				bodyColor: '#D1D5DB',
				borderColor: '#374151',
				borderWidth: 1,
				cornerRadius: 8
			}
		},
		scales: {
			x: {
				grid: {
					color: 'rgba(55, 65, 81, 0.3)',
					drawBorder: false
				},
				ticks: {
					color: '#9CA3AF',
					font: {
						size: 11
					}
				}
			},
			y: {
				grid: {
					color: 'rgba(55, 65, 81, 0.3)',
					drawBorder: false
				},
				ticks: {
					color: '#9CA3AF',
					font: {
						size: 11
					}
				}
			}
		}
	};

	return (
		<ProtectedRoute requireAdmin={true}>
			<div className="min-h-screen bg-zinc-950 text-white">
				<Navbar />

				<div className="flex pt-16">
					<AdminSidebar
						collapsed={sidebarCollapsed}
						onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
					/>

					<div className="flex-1 p-8">
						{/* Header */}
						<div className="mb-8">
							<div className="flex items-center mb-4">
								<div className="p-3 bg-blue-500/20 rounded-xl mr-4">
									<Shield className="h-8 w-8 text-blue-400" />
								</div>
								<div>
									<h1 className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 font-extrabold mb-2">
										Admin Overview
									</h1>
									<p className="text-zinc-400">
										System analytics and management
										dashboard
									</p>
								</div>
							</div>

							{/* Time Range Selector */}
							<div className="flex space-x-2">
								{[7, 30, 90].map((days) => (
									<Button
										key={days}
										onClick={() => setTimeRange(days)}
										variant={
											timeRange === days
												? 'primary'
												: 'outline'
										}
										size="sm"
									>
										{days} days
									</Button>
								))}
							</div>
						</div>

						{loading ? (
							<div className="flex justify-center py-12">
								<Loader />
							</div>
						) : error ? (
							<div className="text-center py-12">
								<div className="text-red-400 mb-2">
									Error loading statistics
								</div>
								<div className="text-zinc-400 text-sm">
									{error}
								</div>
								<button
									onClick={fetchStats}
									className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									Retry
								</button>
							</div>
						) : stats ? (
							<>
								{/* Stats Cards */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
									<div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
										<div className="flex items-center justify-between mb-4">
											<div className="p-3 bg-blue-500/20 rounded-xl">
												<Users className="w-6 h-6 text-blue-400" />
											</div>
											<TrendingUp className="w-5 h-5 text-green-400" />
										</div>
										<h3 className="text-2xl font-bold text-white mb-1">
											{stats.totals.total_users?.toLocaleString() ||
												'0'}
										</h3>
										<p className="text-zinc-400 text-sm">
											Total Users
										</p>
									</div>

									<div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
										<div className="flex items-center justify-between mb-4">
											<div className="p-3 bg-green-500/20 rounded-xl">
												<Activity className="w-6 h-6 text-green-400" />
											</div>
											<TrendingUp className="w-5 h-5 text-green-400" />
										</div>
										<h3 className="text-2xl font-bold text-white mb-1">
											{stats.totals.total_sessions?.toLocaleString() ||
												'0'}
										</h3>
										<p className="text-zinc-400 text-sm">
											Total Sessions
										</p>
									</div>

									<div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
										<div className="flex items-center justify-between mb-4">
											<div className="p-3 bg-purple-500/20 rounded-xl">
												<Database className="w-6 h-6 text-purple-400" />
											</div>
											<TrendingUp className="w-5 h-5 text-green-400" />
										</div>
										<h3 className="text-2xl font-bold text-white mb-1">
											{stats.totals.total_flights?.toLocaleString() ||
												'0'}
										</h3>
										<p className="text-zinc-400 text-sm">
											Total Flights
										</p>
									</div>

									<div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
										<div className="flex items-center justify-between mb-4">
											<div className="p-3 bg-orange-500/20 rounded-xl">
												<TrendingUp className="w-6 h-6 text-orange-400" />
											</div>
											<TrendingUp className="w-5 h-5 text-green-400" />
										</div>
										<h3 className="text-2xl font-bold text-white mb-1">
											{stats.totals.total_logins?.toLocaleString() ||
												'0'}
										</h3>
										<p className="text-zinc-400 text-sm">
											Total Logins
										</p>
									</div>
								</div>

								{/* Charts */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
									{/* Activity Chart */}
									<div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
										<h3 className="text-xl font-semibold text-white mb-6">
											Daily Activity
										</h3>
										<div className="h-80">
											<Line
												data={formatChartData(
													stats.daily
												)}
												options={chartOptions}
											/>
										</div>
									</div>

									{/* New Users Chart */}
									<div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6">
										<h3 className="text-xl font-semibold text-white mb-6">
											New Users
										</h3>
										<div className="h-80">
											<Bar
												data={formatBarChartData(
													stats.daily
												)}
												options={barChartOptions}
											/>
										</div>
									</div>
								</div>
							</>
						) : (
							<div className="text-center py-12 text-zinc-400">
								No statistics available
							</div>
						)}
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
