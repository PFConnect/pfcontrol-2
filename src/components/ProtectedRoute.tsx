import { useAuth } from '../hooks/auth/useAuth';
import { Navigate } from 'react-router-dom';
import Loader from './common/Loader';
import AccessDenied from './AccessDenied';

interface ProtectedRouteProps {
	children: React.ReactNode;
	requireAdmin?: boolean;
	accessDeniedMessage?: string;
}

export default function ProtectedRoute({
	children,
	requireAdmin = false
}: ProtectedRouteProps) {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-black to-slate-900 flex items-center justify-center">
				<Loader />
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (user.isBanned) {
		return <AccessDenied errorType="banned" />;
	}

	if (requireAdmin && !user.isAdmin) {
		return <AccessDenied message="Administrator Access Required" />;
	}

	return <>{children}</>;
}
