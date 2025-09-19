import { useState, useCallback, useEffect, useRef } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // ✅ Fetch wrapper with cookies
  const fetchWithAuth = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const res = await fetch(`http://localhost:3001${url}`, {
        ...options,
        credentials: "include", // 🔑 include cookies
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    },
    []
  );

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      await fetchWithAuth("/auth/logout", { method: "POST" });
    } catch {
      // ignore server errors
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");

    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  }, [fetchWithAuth]);

  // ✅ Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const data = await fetchWithAuth<{ data: AuthResponse }>("/auth/refresh", {
        method: "POST",
      });
      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("accessToken", data.data.accessToken);
      return data.data.accessToken;
    } catch (err) {
      console.error("Failed to refresh token", err);
      await logout();
      return null;
    }
  }, [fetchWithAuth, logout]); // ✅ fixed missing dependency

  // ✅ Register
  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      const data = await fetchWithAuth<{ data: AuthResponse }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("accessToken", data.data.accessToken);
      return data.data;
    },
    [fetchWithAuth]
  );

  // ✅ Login
  const login = useCallback(
    async (email: string, password: string) => {
      const data = await fetchWithAuth<{ data: AuthResponse }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("accessToken", data.data.accessToken);

      // start refresh interval
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      refreshInterval.current = setInterval(refreshToken, 14 * 60 * 1000); // ~14m
      return data.data;
    },
    [fetchWithAuth, refreshToken]
  );

  // ✅ Restore session on page reload
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);

      // start refresh interval
      if (!refreshInterval.current) {
        refreshInterval.current = setInterval(refreshToken, 14 * 60 * 1000);
      }
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [refreshToken]);

  return {
    user,
    accessToken,
    register,
    login,
    logout,
    refreshToken,
  };
}
