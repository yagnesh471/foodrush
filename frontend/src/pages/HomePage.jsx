import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import FoodCard from "../components/FoodCard.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";
import { foodApi, userApi } from "../api/endpoints.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const CATEGORY_ICONS = {
  All: "🍴",
  Burgers: "🍔",
  Pizza: "🍕",
  Indian: "🍛",
  Wraps: "🌯",
  Drinks: "🥤",
  Desserts: "🍰",
};

export default function HomePage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [foods, setFoods] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);

  const { addItem, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const fetchMenu = async (cat, sort) => {
    try {
      const params = {};
      if (cat !== "All") params.category = cat;
      if (sort !== "newest") params.sort = sort;
      
      const [foodData, favData] = await Promise.all([
        foodApi.list(params),
        userApi.getFavorites().catch(() => [])
      ]);
      setFoods(foodData);
      setFavorites(favData.map(f => typeof f === 'string' ? f : f._id));
    } catch (err) {
      setLoadError("Failed to load menu.");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu(activeCategory, activeSort);
  }, [activeCategory, activeSort]);

  const handleToggleFavorite = async (foodId) => {
    try {
      const { favorites: newFavs } = await userApi.toggleFavorite(foodId);
      setFavorites(newFavs);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const categories = ["All", "Burgers", "Pizza", "Indian", "Wraps", "Drinks", "Desserts"];

  const visibleFoods = useMemo(() => {
    let filtered = foods;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return filtered;
  }, [foods, searchQuery]);

  const handleAdd = (food) => {
    addItem(food);
    setIsCartOpen(true);
    showToast(`${food.name} added to cart! 🛒`, "success");
  };

  return (
    <div>
      {initialLoading && <LoadingOverlay message="Loading menu..." />}
      <Navbar />

      <div className="home-wrapper" style={{ display: "block" }}>
        <div className="menu-section" style={{ width: "100%" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="section-title" style={{ margin: 0 }}>🍽️ Our Menu</h2>
            <div className="search-box" style={{ flex: "1", minWidth: "250px", maxWidth: "400px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search for burgers, pizza..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "50px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-primary)", outline: "none" }}
              />
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>🔍</span>
            </div>
          </div>

          <div className="category-filter-container">
            <div className="category-buttons">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${cat === activeCategory ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_ICONS[cat] || "🍽️"} {cat}
                </button>
              ))}
            </div>
            
            <select 
              className="form-input sort-select" 
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value)}
            >
              <option value="newest">🆕 Newest First</option>
              <option value="price_asc">💰 Price: Low to High</option>
              <option value="price_desc">💰 Price: High to Low</option>
              <option value="rating_desc">⭐ Highest Rated</option>
            </select>
          </div>

          <div className="food-grid">
            {loadError && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem", color: "var(--danger)" }}>
                {loadError}
              </div>
            )}

            {!initialLoading && !loadError && visibleFoods.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "var(--card-bg)", borderRadius: "var(--radius)", border: "1px dashed var(--card-border)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>👀</div>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>No matches found</h3>
                <p style={{ margin: 0 }}>
                  {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : "No items found in this category."}
                </p>
              </div>
            )}

            {visibleFoods.map((food) => (
              <FoodCard 
                key={food._id} 
                food={food} 
                onAdd={handleAdd} 
                isFavorite={favorites.includes(food._id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>

      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
