import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setToken, clearToken, getToken } from "../api/client.js";

const AuthContext = createContext(null);

const SESSION_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

const USER_KEY = "foodrush_user";
const LOGIN_AT_KEY = "foodrush_login_at";

function readStoredSession() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    const token = getToken("user");
    const loginAt = Number(localStorage.getItem(LOGIN_AT_KEY) || 0);

    if (!user || !token || !loginAt) return null;
    if (Date.now() - loginAt > SESSION_LIMIT_MS) return null;

    return { user, token };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  // Keep multiple tabs in sync if the user logs out in one of them.
  useEffect(() => {
    const onStorage = (e) => {
      if ([USER_KEY, "foodrush_token", LOGIN_AT_KEY].includes(e.key)) {
        setSession(readStoredSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (user, token) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken("user", token);
    localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
    setSession({ user, token });
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    clearToken("user");
    localStorage.removeItem(LOGIN_AT_KEY);
    localStorage.removeItem("foodrush_cart");
    setSession(null);
  };

  const value = useMemo(
    () => ({
      user: session?.user || null,
      isLoggedIn: !!session,
      login,
      logout,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// --- Admin session (kept separate: different token, different rules) ---

const ADMIN_LOGIN_AT_KEY = "foodrush_admin_login_at";

const AdminAuthContext = createContext(null);

function readStoredAdminSession() {
  const token = getToken("admin");
  const loginAt = Number(localStorage.getItem(ADMIN_LOGIN_AT_KEY) || 0);
  if (!token || !loginAt) return null;
  if (Date.now() - loginAt > SESSION_LIMIT_MS) return null;
  return { token };
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredAdminSession());

  const login = (token) => {
    setToken("admin", token);
    localStorage.setItem(ADMIN_LOGIN_AT_KEY, String(Date.now()));
    setSession({ token });
  };

  const logout = () => {
    clearToken("admin");
    localStorage.removeItem(ADMIN_LOGIN_AT_KEY);
    setSession(null);
  };

  const value = useMemo(() => ({ isAdminLoggedIn: !!session, login, logout }), [session]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
