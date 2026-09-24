import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";

export default function SignupPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", phone: "", password: "", confirm: "" });
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const { username, email, phone, password, confirm } = form;

    if (!username || !email || !phone || !password || !confirm) {
      return setError("Please fill all fields.");
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return setError("Enter a valid 10 digit mobile number.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setSending(true);
    try {
      await authApi.signup({ username, email: email.toLowerCase(), phone, password });
      setPendingEmail(email.toLowerCase());
      setError("");
      showToast("OTP sent successfully to your email.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    const email = pendingEmail || form.email.toLowerCase();
    if (!email) return setError("Please enter email first.");

    setResending(true);
    try {
      await authApi.resendOtp(email);
      setPendingEmail(email);
      showToast("New OTP sent successfully.", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) return setError("Please enter OTP.");

    setVerifying(true);
    try {
      await authApi.verifySignup({ email: pendingEmail, otp: otp.trim() });
      showToast("Account created successfully! Please login.", "success");
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-logo">
          <span className="logo-icon">🍕</span>
          <h1>FoodRush</h1>
          <p>Create account with OTP verification</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Create Account ✨</h2>
          <p className="auth-subtitle">OTP will be sent to your email</p>

          {error && <div className="alert alert-error">{error}</div>}

          {!pendingEmail ? (
            <form onSubmit={handleSignup} autoComplete="off" noValidate>
              <div className="form-group">
                <label className="form-label">👤 Username</label>
                <input className="form-input" type="text" placeholder="Enter username" minLength={3} value={form.username} onChange={update("username")} />
              </div>
              <div className="form-group">
                <label className="form-label">📧 Email</label>
                <input className="form-input" type="email" placeholder="Enter email" value={form.email} onChange={update("email")} />
              </div>
              <div className="form-group">
                <label className="form-label">📱 Phone</label>
                <input className="form-input" type="tel" placeholder="Enter 10 digit mobile number" maxLength={10} value={form.phone} onChange={update("phone")} />
              </div>
              <div className="form-group">
                <label className="form-label">🔒 Password</label>
                <input className="form-input" type="password" placeholder="Enter password" minLength={6} value={form.password} onChange={update("password")} />
              </div>
              <div className="form-group">
                <label className="form-label">🔐 Confirm Password</label>
                <input className="form-input" type="password" placeholder="Confirm password" value={form.confirm} onChange={update("confirm")} />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={sending}>
                {sending ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <div className="otp-section">
              <div className="form-group">
                <label className="form-label">✅ Enter OTP</label>
                <input
                  className="form-input"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button className="btn btn-success btn-full" type="button" onClick={handleVerify} disabled={verifying}>
                {verifying ? "Verifying..." : "Verify & Create Account"}
              </button>
              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: "0.7rem" }}
                type="button"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Resending OTP..." : "Resend OTP"}
              </button>
            </div>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
