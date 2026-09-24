import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  if (!token || !email) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container fade-in">
          <div className="auth-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <h2 className="auth-title">Invalid Link</h2>
            <p className="auth-subtitle">This reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>Request New Link</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setResetting(true);
    try {
      await authApi.resetPassword({ email, token, newPassword });
      showToast("Password reset successful! Please login.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-logo">
          <span className="logo-icon">🔐</span>
          <h1>FoodRush</h1>
          <p>Reset your password securely</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Create New Password</h2>
          <p className="auth-subtitle">Enter a new secure password for your account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">🔐 New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-success btn-full" type="submit" disabled={resetting}>
              {resetting ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="auth-footer">
            Remembered password? <Link to="/login">Back to login →</Link>
          </p>
        </div>
      </div>
      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}

