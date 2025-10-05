import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/auth/useAuth';

import Home from './pages/Home';
import Create from './pages/Create';
import Sessions from './pages/Sessions';
import Submit from './pages/Submit';
import Flights from './pages/Flights';
import Settings from './pages/Settings';
import PFATCFlights from './pages/PFATCFlights';

import Login from './pages/Login';
import NotFound from './pages/NotFound';

import ProtectedRoute from './components/ProtectedRoute';
import AccessDenied from './components/AccessDenied';

import Admin from './pages/Admin';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAudit from './pages/admin/AdminAudit';
import AdminBan from './pages/admin/AdminBan';
import AdminSessions from './pages/admin/AdminSessions';
import AdminTesters from './pages/admin/AdminTesters';

export default function App() {
	const { user } = useAuth();

	return (
		<Router>
			{user && user.isBanned ? (
				<AccessDenied errorType="banned" />
			) : (
				<Routes>
					<Route
						path="/*"
						element={
							<ProtectedRoute>
								<Routes>
									<Route index element={<Home />} />
									<Route
										path="pfatc"
										element={<PFATCFlights />}
									/>
									<Route path="create" element={<Create />} />
									<Route
										path="sessions"
										element={<Sessions />}
									/>
									<Route
										path="view/:sessionId"
										element={<Flights />}
									/>
									<Route
										path="settings"
										element={<Settings />}
									/>
								</Routes>
							</ProtectedRoute>
						}
					/>

					<Route path="/submit/:sessionId" element={<Submit />} />
					<Route path="/login" element={<Login />} />

					<Route
						path="/admin/*"
						element={
							<ProtectedRoute
								requireAdmin={true}
								requireTester={false}
							>
								<Routes>
									<Route index element={<Admin />} />
									<Route
										path="users"
										element={<AdminUsers />}
									/>
									<Route
										path="audit"
										element={<AdminAudit />}
									/>
									<Route path="bans" element={<AdminBan />} />
									<Route
										path="sessions"
										element={<AdminSessions />}
									/>
									<Route
										path="testers"
										element={<AdminTesters />}
									/>
								</Routes>
							</ProtectedRoute>
						}
					/>

					<Route path="*" element={<NotFound />} />
				</Routes>
			)}
		</Router>
	);
}
