import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Create from './pages/Create';
import Sessions from './pages/Sessions';
import Submit from './pages/Submit';

import Login from './pages/Login';
import NotFound from './pages/NotFound';

import Test from './pages/Test';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/submit/:sessionId" element={<Submit />} />
				<Route
					path="/create"
					element={
						<ProtectedRoute>
							<Create />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/sessions"
					element={
						<ProtectedRoute>
							<Sessions />
						</ProtectedRoute>
					}
				/>

				<Route path="/login" element={<Login />} />

				<Route path="/test" element={<Test />} />

				<Route path="*" element={<NotFound />} />
			</Routes>
		</Router>
	);
}
