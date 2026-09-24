import { useEffect, useState } from "react";
import { addressApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";

const ADDRESS_ICONS = { Home: "🏠", Work: "🏢", Other: "📍" };

/**
 * Replaces the old localStorage-based address flow, which required the
 * user to (1) fill the form, (2) click "Save Address", and then
 * (3) separately click the saved card to "select" it before the pay
 * button would even work. Here, saving an address selects it
 * immediately, and any existing default address is preselected on load
 * — checkout only ever asks the user for one extra action if they truly
 * have no saved address yet.
 */
export default function AddressManager({ selectedAddressId, onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "Home", fullAddress: "", landmark: "" });
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    addressApi
      .list()
      .then((data) => {
        if (cancelled) return;
        setAddresses(data);
        const preselect = data.find((a) => a.isDefault) || data[0];
        if (preselect) onSelect(preselect._id);
        else setShowForm(true);
      })
      .catch((err) => showToast(err.message, "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.fullAddress.trim()) {
      showToast("Please enter your address", "error");
      return;
    }

    setSaving(true);
    try {
      const updated = await addressApi.add(form);
      setAddresses(updated);
      const newest = updated[updated.length - 1];
      onSelect(newest._id);
      setForm({ type: "Home", fullAddress: "", landmark: "" });
      setShowForm(false);
      showToast("Address saved and selected ✅", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const updated = await addressApi.remove(id);
      setAddresses(updated);
      if (selectedAddressId === id) {
        const next = updated.find((a) => a.isDefault) || updated[0];
        onSelect(next?._id || null);
      }
      showToast("Address removed", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading your addresses...</div>;
  }

  return (
    <div>
      {addresses.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`saved-address-card ${selectedAddressId === addr._id ? "selected" : ""}`}
              onClick={() => onSelect(addr._id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700 }}>
                  {ADDRESS_ICONS[addr.type] || "📍"} {addr.type}
                  {addr.isDefault && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                      (default)
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(addr._id);
                  }}
                >
                  🗑️
                </button>
              </div>
              <div style={{ marginTop: "0.5rem" }}>{addr.fullAddress}</div>
              {addr.landmark && (
                <div style={{ color: "var(--text-muted)", marginTop: "0.3rem" }}>{addr.landmark}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {!showForm && (
        <button className="btn btn-secondary btn-full" type="button" onClick={() => setShowForm(true)}>
          ➕ Add a new address
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Address Type</label>
            <select
              className="form-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="Home">🏠 Home</option>
              <option value="Work">🏢 Work</option>
              <option value="Other">📍 Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Full Address</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Flat, Street, Area, City..."
              value={form.fullAddress}
              onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Landmark</label>
            <input
              className="form-input"
              type="text"
              placeholder="Near mall, bus stop..."
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-secondary btn-full" type="submit" disabled={saving}>
              {saving ? "💾 Saving..." : "💾 Save & Use This Address"}
            </button>
            {addresses.length > 0 && (
              <button
                className="btn btn-secondary btn-full"
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
