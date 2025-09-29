// src/components/ProtectedRoute.tsx
import { useAuth } from "../hooks/auth/useAuth";
import { Navigate } from "react-router-dom";
import Loader from "./common/Loader";

interface ProtectedRouteProps {
   children: React.ReactNode;
   requireAdmin?: boolean;
}

export default function ProtectedRoute({
   children,
   requireAdmin = false,
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

   if (requireAdmin && !user.isAdmin) {
      return (
         <div className="min-h-screen bg-gradient-to-b from-black to-slate-900 flex items-center justify-center text-white">
            <div className="text-center">
               <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
               <p className="text-gray-400">
                  You need administrator privileges to access this page.
               </p>
            </div>
         </div>
      );
   }

   return <>{children}</>;
}
