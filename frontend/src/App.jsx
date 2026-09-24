import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, AdminAuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ProtectedRoute } from "./components/RouteGuards.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";

function RootRedirect() {
  const { isLoggedIn } = useAuth();
  return <Navigate to={isLoggedIn ? "/home" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <CartProvider>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/admin" element={<AdminPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/tracking" element={<TrackingPage />} />
                    <Route path="/tracking/:orderId" element={<TrackingPage />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CartProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
