import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/endpoints.js";
import { formatDate, statusBadgeClass } from "../utils/format.js";

export default function OrderHistoryModal({ open, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    orderApi
      .mine()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleTrack = (orderId) => {
    onClose();
    navigate(`/tracking/${orderId}`);
  };

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: "700px", maxHeight: "80vh", overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.2rem",
          }}
        >
          <h3 className="panel-title" style={{ margin: 0 }}>
            📋 Your Orders
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {loading && <div style={{ padding: "1rem", color: "var(--text-muted)" }}>Loading orders...</div>}
        {error && <div style={{ padding: "1rem", color: "var(--danger)" }}>{error}</div>}

        {!loading && !error && orders.length === 0 && (
          <div className="cart-empty">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <p>No orders yet</p>
            <small style={{ color: "var(--text-muted)" }}>Place your first order!</small>
          </div>
        )}

        {orders.map((order) => (
          <div className="order-card" key={order.orderId}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>🏷️ {order.orderId}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  📅 {formatDate(order.createdAt)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span className={`status-badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
                <button className="btn btn-primary btn-sm" onClick={() => handleTrack(order.orderId)}>
                  🗺️ Track
                </button>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              🍽️ {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
            </div>
            <div style={{ fontWeight: 700, color: "var(--secondary)" }}>Total: ₹{order.totalPrice}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
