import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { cartCount } from "../utils/cartMath.js";
import CartDrawer from "./CartDrawer.jsx";
import ProfileDrawer from "./ProfileDrawer.jsx";
import OrderHistoryModal from "./OrderHistoryModal.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Navbar() {
  const { user } = useAuth();
  const { cart, isCartOpen, setIsCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const count = cartCount(cart);

  return (
    <>
      <nav className="navbar">
        <NavLink to="/home" className="navbar-brand">
          🍔 FoodRush
        </NavLink>
        
        <ul className="navbar-nav">
          <li>
            <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>
              🍽️ Menu
            </NavLink>
          </li>
        </ul>

        {/* Only the menu is shown natively on screen by default */}
        <div className="navbar-user">
          
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={toggleTheme}
            style={{ borderRadius: "50%", width: "40px", height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", background: "var(--card-bg)" }}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setIsCartOpen(true)}
            style={{ position: "relative", padding: "0.5rem 1rem" }}
          >
            🛒 Cart
            {count > 0 && (
              <span style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "var(--primary)",
                color: "white",
                fontSize: "0.7rem",
                fontWeight: "bold",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {count}
              </span>
            )}
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsProfileOpen(true)}
            style={{ borderRadius: "50%", width: "40px", height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}
          >
            👤
          </button>

        </div>
      </nav>

      {/* Global Modals & Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ProfileDrawer 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onOpenOrders={() => setIsOrdersOpen(true)} 
      />
      <OrderHistoryModal open={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </>
  );
}
