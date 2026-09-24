import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function LoginPage() {
  const { isLoggedIn, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoggedIn) return <Navigate to="/home" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter username/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await authApi.login({ username: identifier.trim(), password });
      login(data.user, data.token);
      showToast("Login successful!", "success");
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-logo">
          <span className="logo-icon">🍔</span>
          <h1>FoodRush</h1>
          <p>Delicious food, delivered fast 🚀</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Welcome Back! 👋</h2>
          <p className="auth-subtitle">Sign in to continue ordering</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <label className="form-label">👤 Username or Email</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your username or email"
                autoComplete="off"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">🔒 Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "🚀 Sign In"}
            </button>
          </form>

          <p className="auth-footer">
            <Link className="small-link" to="/forgot-password">
              Forgot password?
            </Link>
          </p>

          <div className="divider">or</div>

          <Link to="/admin" className="btn btn-secondary btn-full">
            ⚙️ Admin Panel
          </Link>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Create one →</Link>
          </p>
        </div>
      </div>
      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
