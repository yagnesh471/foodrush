import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { userApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function ProfileDrawer({ isOpen, onClose, onOpenOrders }) {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { clearCart } = useCart();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", phone: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username || "", email: user.email || "", phone: user.phone || "" });
    }
  }, [user, isOpen]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login", { replace: true });
  };

  const handleTracking = () => {
    onClose();
    navigate("/tracking");
  };

  const handleOrders = () => {
    onClose();
    onOpenOrders();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await userApi.updateProfile(formData);
      // Ideally we'd update AuthContext here, but refreshing the page also works, or just show success
      showToast("Profile updated! Refresh to see changes globally.", "success");
      setIsEditing(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword.length < 6) {
      return showToast("New password must be at least 6 characters", "error");
    }
    setSaving(true);
    try {
      await userApi.changePassword(passwordData);
      showToast("Password updated successfully!", "success");
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: "", newPassword: "" });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await userApi.deleteAccount();
      clearCart();
      logout();
      onClose();
      navigate("/login", { replace: true });
      showToast("Account deleted successfully.", "info");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3 className="section-title" style={{ margin: 0, fontSize: "1.2rem" }}>
            👤 My Profile
          </h3>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          <div style={{ textAlign: "center", padding: "1.5rem 0", borderBottom: "1px solid var(--card-border)", marginBottom: "1rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>👤</div>
            {!isEditing && !isChangingPassword ? (
              <>
                <h2 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>{user?.username || "Guest"}</h2>
                <p style={{ margin: "0 0 0.5rem 0", color: "var(--text-muted)" }}>{user?.email}</p>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                  <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }} onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
                  <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }} onClick={() => setIsChangingPassword(true)}>🔐 Change Password</button>
                </div>
              </>
            ) : isEditing ? (
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input className="form-input" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                <input className="form-input" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input className="form-input" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? "..." : "Save"}</button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input className="form-input" type="password" placeholder="Old Password" value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} />
                <input className="form-input" type="password" placeholder="New Password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePasswordSave} disabled={saving}>{saving ? "..." : "Save"}</button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsChangingPassword(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "1rem" }} onClick={() => { onClose(); navigate("/favorites"); }}>
              ❤️ My Favorites
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "1rem" }} onClick={handleOrders}>
              📋 Order History
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: "flex-start", padding: "1rem" }} onClick={handleTracking}>
              🗺️ Live Tracking
            </button>
          </div>
        </div>

        <div className="drawer-footer" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-full" onClick={handleLogout}>
            🚪 Logout
          </button>
          <button className="btn btn-danger btn-full" onClick={() => setIsConfirmingDelete(true)}>
            🗑️ Delete Account
          </button>
        </div>
      </div>

      {isConfirmingDelete && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "var(--card-bg)", padding: "2rem", borderRadius: "var(--radius)",
            maxWidth: "400px", width: "90%", textAlign: "center",
            border: "1px solid var(--danger)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Are you absolutely sure?</h3>
            <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-muted)" }}>
              This will permanently wipe all your data, including order history. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-danger" style={{ flex: 1, padding: "0.75rem" }} onClick={handleDeleteAccount} disabled={saving}>
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: "0.75rem" }} onClick={() => setIsConfirmingDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
