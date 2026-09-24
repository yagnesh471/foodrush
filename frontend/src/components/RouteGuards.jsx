import { Navigate, Outlet } from "react-router-dom";
import { useAuth, useAdminAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminProtectedRoute() {
  const { isAdminLoggedIn } = useAdminAuth();
  if (!isAdminLoggedIn) return <Navigate to="/admin" replace />;
  return <Outlet />;
}
