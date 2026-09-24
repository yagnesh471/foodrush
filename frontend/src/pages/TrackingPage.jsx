import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import StatusTimeline from "../components/StatusTimeline.jsx";
import { orderApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatDate } from "../utils/format.js";

const BIKE_POSITIONS = [
  { top: "35%", left: "15%", label: "Waiting..." },
  { top: "35%", left: "15%", label: "Picking up..." },
  { top: "40%", left: "45%", label: "On the way!" },
  { top: "45%", left: "72%", label: "Arrived!" },
];

const STATUS_INDEX = { "Order Placed": 0, Preparing: 1, "Out for Delivery": 2, Delivered: 3 };

// How often we re-ask the server for the true status. This is display
// polling only — the actual delivery/timing logic lives server-side, so
// whether this interval ever runs has no bearing on whether an order
// really becomes "Delivered"; it only affects how quickly *this open
// tab* reflects that fact.
import { useCart } from "../context/CartContext.jsx";
import { foodApi } from "../api/endpoints.js";
import { io } from "socket.io-client";

// Remove POLL_INTERVAL_MS since we use WebSockets now

function OrderTracker({ initialOrderId }) {
  const [order, setOrder] = useState(null);
  const [displayEta, setEta] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();
  const { addMultipleItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const tickRef = useRef(null);
  
  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewItem, setReviewItem] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await orderApi.get(initialOrderId);
      setOrder(data);
      setEta(data.etaSeconds);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    }
  }, [initialOrderId]);

  useEffect(() => {
    fetchOrder();
    
    const pollInterval = setInterval(fetchOrder, 10000);

    // Connect to WebSocket
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      withCredentials: true
    });
    
    socket.emit("join_order", initialOrderId);
    
    socket.on("order_updated", (updatedOrder) => {
      setOrder(updatedOrder);
      // Optional: recalculate ETA if we wanted to
      showToast(`Order status updated to: ${updatedOrder.status}`, "info");
    });
    
    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [fetchOrder, initialOrderId, showToast]);

  useEffect(() => {
    if (displayEta === null || displayEta <= 0) return;
    
    // We only want to start this interval once when we have an ETA
    const interval = setInterval(() => {
      setEta((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    
    tickRef.current = interval;
    return () => clearInterval(interval);
  }, [displayEta === null || displayEta <= 0]);

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await orderApi.cancel(order.orderId);
      setOrder(updated);
      showToast("Order cancelled successfully.", "info");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    addMultipleItems(order.items);
    showToast("Items added to cart!", "success");
    setIsCartOpen(true);
    navigate("/home");
  };

  const handleSubmitReview = async () => {
    if (!reviewItem) return;
    setSubmittingReview(true);
    try {
      await foodApi.addReview(reviewItem.foodId, { rating, comment });
      showToast("Review submitted successfully! Thank you.", "success");
      setReviewItem(null);
      setComment("");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loadError) return <div className="alert alert-error" style={{ marginBottom: "2rem" }}>{loadError}</div>;
  if (!order) return <div className="spinner" style={{ margin: "2rem auto" }} />;

  const idx = Math.max(STATUS_INDEX[order.status] ?? 0, 0);
  const bikePos = BIKE_POSITIONS[idx];
  const canCancel = !["Out for Delivery", "Delivered", "Cancelled"].includes(order.status);

  const etaLabel =
    order.status === "Cancelled"
      ? "⏱️ ETA: Cancelled"
      : order.status === "Delivered" || displayEta <= 0
      ? "⏱️ ETA: Delivered! 🎉"
      : `⏱️ ETA: ${displayEta} sec`;

  return (
    <div style={{ marginBottom: "4rem", paddingBottom: "2rem", borderBottom: "2px dashed var(--card-border)" }}>
      <div className="tracking-info-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Order ID</div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>{order.orderId}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Order Time</div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{formatDate(order.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total Paid</div>
            <div style={{ fontWeight: 800, color: "var(--secondary)", fontSize: "1.1rem" }}>₹{order.totalPrice}</div>
            {order.discountAmount > 0 && (
              <div style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Saved ₹{order.discountAmount}</div>
            )}
          </div>
          <div>
            <span className="eta-chip">{etaLabel}</span>
          </div>
        </div>

        {order.specialInstructions && (
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--input-bg)", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--accent)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>📝 Special Instructions</div>
            <div style={{ fontSize: "0.95rem" }}>{order.specialInstructions}</div>
          </div>
        )}

        <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "1.5rem" }}>
          {order.status === "Cancelled" ? "❌ Cancelled" : `${["✅", "👨‍🍳", "🛵", "🏠"][idx]} ${order.status}`}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {canCancel && (
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "❌ Cancel Order"}
            </button>
          )}
          {order.status === "Delivered" && (
            <button className="btn btn-primary" onClick={handleReorder}>
              🔄 Reorder These Items
            </button>
          )}
        </div>
      </div>

      <div className="tracking-grid">
        <div className="tracking-info-card">
          <h3 className="panel-title">📍 Delivery Progress</h3>
          <StatusTimeline status={order.status} />
          {order.status === "Delivered" && (
            <div className="fade-in" style={{ textAlign: "center", padding: "1rem", marginTop: "1.5rem", background: "rgba(6, 214, 160, 0.15)", borderRadius: "var(--radius-sm)", border: "1px solid var(--accent)", animation: "float 3s ease-in-out infinite" }}>
              <h3 style={{ color: "var(--accent)", margin: "0 0 0.5rem 0", fontSize: "1.2rem" }}>🎉 Delivery Complete! 🎉</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>Enjoy your delicious food! Thank you for choosing FoodRush.</p>
            </div>
          )}
        </div>

        <div className="map-placeholder">
          <div className="route-line" />
          <div className="pin-wrapper" style={{ top: "30%", left: "15%" }}>
            <div style={{ fontSize: "2rem" }}>🏪</div>
            <div className="map-label">Restaurant</div>
          </div>
          <div className="pin-wrapper" style={{ top: "45%", right: "15%" }}>
            <div style={{ fontSize: "2rem" }}>🏠</div>
            <div className="map-label">Your Location</div>
          </div>
          <div className="delivery-bike" style={{ top: bikePos.top, left: bikePos.left }}>
            🛵
            <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", background: "var(--primary)", color: "white", padding: "2px 6px", borderRadius: "10px", whiteSpace: "nowrap" }}>
              {bikePos.label}
            </div>
          </div>
        </div>
      </div>

      <div className="tracking-info-card" style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }}>
        <h3 className="panel-title">🍽️ Items Ordered</h3>
        {order.items.map((item) => (
          <div
            key={item.name}
            className="summary-row"
            style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              {item.name} <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>×{item.quantity}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontWeight: "bold" }}>₹{item.price * item.quantity}</span>
              {order.status === "Delivered" && (
                <button className="btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "var(--dark2)" }} onClick={() => setReviewItem(item)}>
                  ⭐ Rate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviewItem && (
        <div className="tracking-info-card fade-in" style={{ marginBottom: "1.5rem", border: "1px solid var(--accent)" }}>
          <h3 className="panel-title" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>⭐ Review {reviewItem.name}</span>
            <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }} onClick={() => setReviewItem(null)}>✕</button>
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                onClick={() => setRating(star)} 
                style={{ fontSize: "2rem", cursor: "pointer", color: star <= rating ? "gold" : "var(--dark2)" }}
              >
                ★
              </span>
            ))}
          </div>
          <textarea 
            className="form-input" 
            placeholder="Tell us what you thought!" 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            rows={3} 
            style={{ marginBottom: "1rem" }} 
          />
          <button className="btn btn-primary" onClick={handleSubmitReview} disabled={submittingReview}>
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  const { orderId: routeOrderId } = useParams();
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routeOrderId) {
      setLoading(false);
      return;
    }

    orderApi
      .mine()
      .then((orders) => {
        setOrdersList(orders);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
        setLoading(false);
      });
  }, [routeOrderId, navigate]);

  if (routeOrderId) {
    return (
      <div>
        <Navbar />
        <div className="tracking-wrapper fade-in">
          <h2 className="section-title">🗺️ Order Tracking</h2>
          <OrderTracker initialOrderId={routeOrderId} />
          <button className="btn btn-primary" onClick={() => navigate("/tracking")}>
            ← Back to All Orders
          </button>
        </div>
        <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="tracking-wrapper fade-in">
        <h2 className="section-title">📦 Your Orders</h2>

        {loading ? (
          <div className="spinner" style={{ margin: "3rem auto" }} />
        ) : ordersList.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {ordersList.map((order) => {
              const isActive = order.status !== "Delivered" && order.status !== "Cancelled";
              return (
                <div
                  key={order.orderId}
                  className="tracking-info-card"
                  style={{ cursor: "pointer", transition: "transform 0.2s", opacity: isActive ? 1 : 0.7 }}
                  onClick={() => navigate(`/tracking/${order.orderId}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Order #{order.orderId}</h3>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{formatDate(order.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="status-badge" style={{ background: isActive ? "var(--primary)" : "var(--dark2)", color: isActive ? "white" : "var(--text-muted)", border: isActive ? "none" : "1px solid var(--card-border)" }}>
                        {order.status}
                      </span>
                      <div style={{ marginTop: "0.5rem", fontWeight: "bold", color: "var(--secondary)" }}>
                        ₹{order.totalPrice}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tracking-info-card" style={{ textAlign: "center", padding: "3rem" }}>
            <h3 style={{ margin: "0 0 1rem 0" }}>You have no orders yet.</h3>
            <button className="btn btn-primary" onClick={() => navigate("/home")}>
              Go to Menu
            </button>
          </div>
        )}
      </div>

      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
