import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import AddressManager from "../components/AddressManager.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { orderApi } from "../api/endpoints.js";
import { cartSubtotal, cartGst, cartGrandTotal } from "../utils/cartMath.js";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "credit", label: "Credit Card", icon: "💳" },
  { id: "debit", label: "Debit Card", icon: "🏧" },
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
];

export default function PaymentPage() {
  const { cart, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [method, setMethod] = useState("cod");
  const [addressId, setAddressId] = useState(null);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  if (!cart.length) return <Navigate to="/home" replace />;

  const subtotal = cartSubtotal(cart);
  const gst = cartGst(subtotal);
  const total = cartGrandTotal(cart);
  const finalTotal = Math.max(0, total - (appliedPromo ? appliedPromo.discountAmount : 0));

  const handleApplyPromo = async () => {
    setPromoError("");
    setApplyingPromo(true);
    try {
      const data = await orderApi.validatePromo(promoCode);
      setAppliedPromo(data);
      showToast("Promo code applied!", "success");
    } catch (err) {
      setPromoError(err.message);
      setAppliedPromo(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (!addressId) {
      setError("Please select or add a delivery address.");
      return;
    }
    
    if (method !== "cod") {
      setError("Coming Soon! This feature will be available shortly. Please select Cash on Delivery for now.");
      return;
    }

    setPlacing(true);
    try {
      const items = cart.map((item) => ({
        foodId: item.food._id,
        name: item.food.name,
        price: item.food.price,
        quantity: item.quantity,
      }));

      const response = await orderApi.create({
        items,
        addressId,
        paymentMethod: method,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        specialInstructions,
        latitude: 28.6139 + (Math.random() - 0.5) * 0.05,
        longitude: 77.209 + (Math.random() - 0.5) * 0.05,
      });

      clearCart();
      showToast("🎉 Order placed successfully!", "success");
      navigate(`/tracking/${response.orderId}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="payment-wrapper fade-in">
        <h2 className="section-title">💳 Checkout</h2>

        <div className="payment-card">
          <h3 className="panel-title">🧾 Order Summary</h3>

          {cart.map((item) => (
            <div
              className="summary-row"
              key={item.food._id}
              style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--card-border)" }}
            >
              <span>
                {item.food.name} <span style={{ color: "var(--text-muted)" }}>×{item.quantity}</span>
              </span>
              <span>₹{item.food.price * item.quantity}</span>
            </div>
          ))}

          <div style={{ marginTop: "1rem" }}>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="summary-row">
              <span>GST (5%)</span>
              <span>₹{gst}</span>
            </div>
            <div className="summary-row">
              <span>🛵 Delivery</span>
              <span>₹40</span>
            </div>
            
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Promo Code" 
                value={promoCode} 
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                style={{ flex: 1, textTransform: "uppercase" }}
              />
              <button 
                className="btn btn-secondary" 
                onClick={handleApplyPromo}
                disabled={applyingPromo || !promoCode || appliedPromo}
              >
                {applyingPromo ? "..." : appliedPromo ? "Applied!" : "Apply"}
              </button>
            </div>
            {promoError && <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{promoError}</div>}
            
            {appliedPromo && (
              <div className="summary-row" style={{ color: "var(--accent)" }}>
                <span>🎟️ Discount ({appliedPromo.code})</span>
                <span>-₹{appliedPromo.discountAmount}</span>
              </div>
            )}
            
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>
        </div>

        <div className="payment-card">
          <h3 className="panel-title">📍 Delivery Address</h3>
          <AddressManager selectedAddressId={addressId} onSelect={setAddressId} />

          <hr style={{ margin: "2rem 0", borderColor: "rgba(255,255,255,0.1)" }} />
          
          <h3 className="panel-title">📝 Special Instructions</h3>
          <textarea
            className="form-input"
            rows={3}
            placeholder="E.g., Make it extra spicy 🌶️, Leave at the door..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            style={{ resize: "vertical" }}
          ></textarea>

          <hr style={{ margin: "2rem 0", borderColor: "rgba(255,255,255,0.1)" }} />

          <h3 className="panel-title">💰 Select Payment Method</h3>
          <div className="payment-methods">
            {PAYMENT_METHODS.map((pm) => (
              <div
                key={pm.id}
                className={`payment-option ${method === pm.id ? "selected" : ""}`}
                onClick={() => {
                  setMethod(pm.id);
                  setError("");
                }}
              >
                <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "0.3rem" }}>{pm.icon}</span>
                {pm.label}
              </div>
            ))}
          </div>

          {method === "cod" && (
            <div className="alert alert-info" style={{ marginTop: "1rem" }}>
              💵 You'll pay ₹{finalTotal} when your order arrives.
            </div>
          )}
          {method !== "cod" && (
            <div className="alert alert-warning" style={{ marginTop: "1rem" }}>
              ⚠️ Coming Soon! This feature will be available shortly. Please use Cash on Delivery for now.
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</div>}

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "1rem" }}
            onClick={handlePlaceOrder}
            disabled={placing || method !== "cod"}
          >
            {placing ? "⏳ Placing Order..." : "🔒 Place Order"}
          </button>
        </div>
      </div>

      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
