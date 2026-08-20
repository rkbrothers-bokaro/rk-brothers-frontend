import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { setTokens, clearTokens, getAccessToken, setLogoutHandler } from "../api/tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setLogoutHandler(() => setUser(null));

    const storedUser = sessionStorage.getItem("user");
    if (getAccessToken() && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setInitializing(false);
  }, []);

  const login = useCallback(async (phone, password) => {
    const { data: body } = await axiosInstance.post("/auth/login", { phone, password });
    const data = body?.data ?? body;
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    sessionStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    sessionStorage.removeItem("user");
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    logout,
    initializing,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
