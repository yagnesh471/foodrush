import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendLink = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter your email.");

    setSendingLink(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
      showToast("Reset link sent to your email.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingLink(false);
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
          <h2 className="auth-title">Forgot Password?</h2>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>

          {error && <div className="alert alert-error">{error}</div>}

          {sent ? (
            <div className="alert alert-info" style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📨</div>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>Check your inbox</h3>
              <p style={{ margin: 0 }}>We've sent a password reset link to <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSendLink}>
              <div className="form-group">
                <label className="form-label">📧 Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button className="btn btn-secondary btn-full" type="submit" disabled={sendingLink}>
                {sendingLink ? "Sending Link..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <p className="auth-footer">
            Remembered password? <Link to="/login">Back to login →</Link>
          </p>
        </div>
      </div>
      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
