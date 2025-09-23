import React, { useState, useEffect } from 'react';
import {
	getCurrentUser,
	type User,
	logout as apiLogout
} from '../../utils/fetch/auth';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshUser = async () => {
		setIsLoading(true);
		try {
			const currentUser = await getCurrentUser();
			setUser(currentUser);
		} catch (error) {
			console.error('Error refreshing user:', error);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	const login = () => {
		window.location.href = `${
			import.meta.env.VITE_SERVER_URL
		}/api/auth/discord`;
	};

	const logout = async () => {
		try {
			await apiLogout();
			setUser(null);
		} catch (error) {
			console.error('Error logging out:', error);
		}
	};

	useEffect(() => {
		refreshUser();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				login,
				logout,
				refreshUser
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
