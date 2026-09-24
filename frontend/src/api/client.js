const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const TOKEN_KEYS = {
  user: "foodrush_token",
  admin: "foodrush_admin_token",
};

export function getToken(kind = "user") {
  return localStorage.getItem(TOKEN_KEYS[kind]);
}

export function setToken(kind, token) {
  localStorage.setItem(TOKEN_KEYS[kind], token);
}

export function clearToken(kind) {
  localStorage.removeItem(TOKEN_KEYS[kind]);
}

/**
 * Thin fetch wrapper: attaches the right bearer token (user vs admin),
 * serializes JSON bodies, and normalizes error responses into a thrown
 * Error with the server's message so callers can just try/catch.
 */
export async function apiRequest(endpoint, { auth = "user", ...options } = {}) {
  const token = auth ? getToken(auth) : null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
