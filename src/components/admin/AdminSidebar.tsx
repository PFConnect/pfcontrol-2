import { Link, useLocation } from 'react-router-dom';
import {
	BarChart3,
	Users,
	Database,
	Activity,
	ChevronLeft,
	ChevronRight,
	Shield
} from 'lucide-react';
import ProtectedRoute from '../ProtectedRoute';

interface AdminSidebarProps {
	collapsed?: boolean;
	onToggle?: () => void;
}

export default function AdminSidebar({
	collapsed = false,
	onToggle
}: AdminSidebarProps) {
	const location = useLocation();

	const menuItems = [
		{
			icon: BarChart3,
			label: 'Overview',
			path: '/admin',
			description: 'Dashboard & Analytics'
		},
		{
			icon: Users,
			label: 'Users',
			path: '/admin/users',
			description: 'User Management'
		},
		{
			icon: Activity,
			label: 'Sessions',
			path: '/admin/sessions',
			description: 'Session Management'
		},
		{
			icon: Database,
			label: 'System',
			path: '/admin/system',
			description: 'System Information'
		}
	];

	return (
		<ProtectedRoute requireAdmin={true}>
			<div
				className={`bg-zinc-900 border-r border-zinc-700/50 transition-all duration-300 h-fit-screen ${
					collapsed ? 'w-16' : 'w-64'
				} flex flex-col`}
			>
				{/* Header */}
				<div className="p-4 border-b border-zinc-700/50">
					<div className="flex items-center justify-between">
						{!collapsed && (
							<div className="flex items-center space-x-3">
								<div className="p-2 bg-blue-500/20 rounded-lg">
									<Shield className="w-5 h-5 text-blue-400" />
								</div>
								<div>
									<h2 className="text-white font-semibold">
										Admin Panel
									</h2>
									<p className="text-zinc-400 text-xs">
										System Management
									</p>
								</div>
							</div>
						)}
						<button
							onClick={onToggle}
							className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
						>
							{collapsed ? (
								<ChevronRight className="w-4 h-4" />
							) : (
								<ChevronLeft className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-4">
					<div className="space-y-2">
						{menuItems.map((item) => {
							const Icon = item.icon;
							const isActive = location.pathname === item.path;

							return (
								<Link
									key={item.path}
									to={item.path}
									className={`
                                    flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200
                                    ${
										isActive
											? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
											: 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
									}
                                    ${collapsed ? 'justify-center' : ''}
                                `}
									title={collapsed ? item.label : undefined}
								>
									<Icon className="w-5 h-5 flex-shrink-0" />
									{!collapsed && (
										<div className="flex-1 min-w-0">
											<div className="font-medium">
												{item.label}
											</div>
											<div className="text-xs opacity-75 truncate">
												{item.description}
											</div>
										</div>
									)}
								</Link>
							);
						})}
					</div>
				</nav>
			</div>
		</ProtectedRoute>
	);
}
