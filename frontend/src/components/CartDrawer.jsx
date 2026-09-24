import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cartCount, cartSubtotal, cartGst, cartGrandTotal } from "../utils/cartMath.js";

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, addItem, removeOne, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const count = cartCount(cart);
  const subtotal = cartSubtotal(cart);
  const gst = cartGst(subtotal);
  const grandTotal = cartGrandTotal(cart);

  const handleCheckout = () => {
    if (!cart.length) {
      showToast("Your cart is empty!", "error");
      return;
    }
    onClose();
    navigate("/payment");
  };

  const handleClear = () => {
    clearCart();
    showToast("Cart cleared 🗑️", "info");
  };

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3 className="section-title" style={{ margin: 0, fontSize: "1.2rem" }}>
            🛒 Your Cart
            {count > 0 && (
              <span
                style={{
                  fontSize: "0.85rem",
                  background: "var(--primary)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "50px",
                  verticalAlign: "middle",
                  marginLeft: "0.5rem"
                }}
              >
                {count}
              </span>
            )}
          </h3>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          <div className="cart-items" style={{ margin: 0, maxHeight: "none" }}>
            {cart.length === 0 ? (
              <div className="cart-empty" style={{ marginTop: "3rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
                <p>Your cart is empty 🍔</p>
                <small style={{ color: "var(--text-muted)" }}>Add some delicious items!</small>
              </div>
            ) : (
              cart.map((item) => (
                <div className="cart-item" key={item.food._id}>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.food.name}</div>
                    <div className="cart-item-price">
                      ₹{item.food.price} × {item.quantity}
                    </div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => removeOne(item.food._id)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => addItem(item.food)}>
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="cart-summary">
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
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{grandTotal}</span>
              </div>
              <button className="btn btn-primary btn-full" style={{ marginTop: "1rem" }} onClick={handleCheckout}>
                💳 Proceed to Pay
              </button>
              <button className="btn btn-secondary btn-full" style={{ marginTop: "0.5rem" }} onClick={handleClear}>
                🗑️ Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
