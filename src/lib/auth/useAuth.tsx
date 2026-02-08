import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api/client";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth/authStore";
import type { TokenResponse, User } from "@/lib/auth/types";
import { useQuery } from "@tanstack/react-query";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = getAccessToken();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/me"),
    enabled: !!token
  });

  const [user, setUser] = React.useState<User | null>(data ?? null);

  React.useEffect(() => {
    if (data) setUser(data);
  }, [data]);

  const login = async (email: string, password: string) => {
    const res = await api.post<TokenResponse>("/auth/login", { email, password });
    setTokens(res.access_token, res.refresh_token);
    setUser({ email, role: "user" });
    navigate("/");
  };

  const register = async (email: string, password: string) => {
    const res = await api.post<TokenResponse>("/auth/register", { email, password });
    setTokens(res.access_token, res.refresh_token);
    setUser({ email, role: "user" });
    navigate("/");
  };

  const logout = () => {
    api.post("/auth/logout", {}).catch(() => null);
    clearTokens();
    setUser(null);
    navigate("/login");
  };

  return <AuthContext.Provider value={{ user, loading: isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
