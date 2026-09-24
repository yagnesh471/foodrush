import { apiRequest } from "./client.js";

export const authApi = {
  signup: (payload) => apiRequest("/auth/signup", { method: "POST", body: JSON.stringify(payload), auth: null }),
  resendOtp: (email) => apiRequest("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }), auth: null }),
  verifySignup: (payload) => apiRequest("/auth/verify-signup", { method: "POST", body: JSON.stringify(payload), auth: null }),
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(payload), auth: null }),
  forgotPassword: (email) => apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }), auth: null }),
  resetPassword: (payload) => apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify(payload), auth: null }),
};

export const foodApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(q ? `/foods?${q}` : "/foods", { auth: null });
  },
  getReviews: (foodId) => apiRequest(`/foods/${foodId}/reviews`, { auth: null }),
  addReview: (foodId, payload) => apiRequest(`/foods/${foodId}/reviews`, { method: "POST", body: JSON.stringify(payload) }),
};

export const userApi = {
  getFavorites: () => apiRequest("/users/favorites"),
  toggleFavorite: (foodId) => apiRequest(`/users/favorites/${foodId}`, { method: "POST" }),
  updateProfile: (payload) => apiRequest("/users/profile", { method: "PATCH", body: JSON.stringify(payload) }),
  changePassword: (payload) => apiRequest("/users/password", { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAccount: () => apiRequest("/users/profile", { method: "DELETE" }),
};

export const addressApi = {
  list: () => apiRequest("/addresses"),
  add: (payload) => apiRequest("/addresses", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/addresses/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id) => apiRequest(`/addresses/${id}`, { method: "DELETE" }),
};

export const orderApi = {
  create: (payload) => apiRequest("/orders", { method: "POST", body: JSON.stringify(payload) }),
  validatePromo: (code) => apiRequest("/orders/validate-promo", { method: "POST", body: JSON.stringify({ code }) }),
  confirmPayment: (orderId) => apiRequest(`/orders/${orderId}/confirm-payment`, { method: "POST" }),
  mine: () => apiRequest("/orders/mine"),
  get: (orderId) => apiRequest(`/orders/${orderId}`),
  cancel: (orderId) => apiRequest(`/orders/${orderId}/cancel`, { method: "PATCH" }),
};

export const adminApi = {
  login: (payload) => apiRequest("/admin/login", { method: "POST", body: JSON.stringify(payload), auth: null }),
  stats: () => apiRequest("/admin/stats", { auth: "admin" }),
  orders: () => apiRequest("/admin/orders", { auth: "admin" }),
  updateOrderStatus: (orderId, status) =>
    apiRequest(`/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }), auth: "admin" }),
  addFood: (payload) => apiRequest("/admin/foods", { method: "POST", body: JSON.stringify(payload), auth: "admin" }),
  updateFood: (id, payload) => apiRequest(`/admin/foods/${id}`, { method: "PATCH", body: JSON.stringify(payload), auth: "admin" }),
  deleteFood: (id) => apiRequest(`/admin/foods/${id}`, { method: "DELETE", auth: "admin" }),
};
