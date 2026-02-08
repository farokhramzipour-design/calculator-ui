import { Navigate } from "react-router-dom";
import { getAccessToken } from "@/lib/auth/authStore";
import { useAuth } from "@/lib/auth/useAuth";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const token = getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
