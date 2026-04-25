import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-xl border border-zinc-700 bg-zinc-900/70 p-8 text-center">
          <h1 className="text-2xl font-semibold">Checking Session...</h1>
          <p className="mt-3 text-zinc-300">
            Please wait while we validate your login.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
