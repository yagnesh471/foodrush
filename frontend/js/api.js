const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://foodrush-backend7.onrender.com/api";
async function apiRequest(endpoint, options = {}) {
  const userToken = localStorage.getItem("foodrush_token");
  const adminToken = localStorage.getItem("foodrush_admin_token");
  const token = endpoint.startsWith("/admin") ? adminToken : userToken;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
