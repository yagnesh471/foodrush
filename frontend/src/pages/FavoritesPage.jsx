import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import FoodCard from "../components/FoodCard.jsx";
import { userApi, foodApi } from "../api/endpoints.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useNavigate } from "react-router-dom";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([foodApi.list(), userApi.getFavorites()])
      .then(([allFoods, favIds]) => {
        setFoods(allFoods);
        setFavorites(favIds.map(f => typeof f === "string" ? f : f._id));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleFavorite = async (foodId) => {
    try {
      const { favorites: newFavs } = await userApi.toggleFavorite(foodId);
      setFavorites(newFavs);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAdd = (food) => {
    addItem(food);
    setIsCartOpen(true);
    showToast(`${food.name} added to cart! 🛒`, "success");
  };

  const favFoods = foods.filter(f => favorites.includes(f._id));

  return (
    <div>
      <Navbar />
      <div className="home-wrapper" style={{ display: "block" }}>
        <div className="menu-section" style={{ width: "100%" }}>
          <h2 className="section-title">❤️ Your Favorites</h2>
          {loading ? (
            <div className="spinner" style={{ margin: "2rem auto" }} />
          ) : favFoods.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--card-bg)", borderRadius: "var(--radius)" }}>
              <h3>No favorites yet!</h3>
              <button className="btn btn-primary" onClick={() => navigate("/home")}>Browse Menu</button>
            </div>
          ) : (
            <div className="food-grid">
              {favFoods.map((food) => (
                <FoodCard 
                  key={food._id} 
                  food={food} 
                  onAdd={handleAdd} 
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

