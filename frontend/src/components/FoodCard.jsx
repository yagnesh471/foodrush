const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop";

export default function FoodCard({ food, onAdd, isFavorite, onToggleFavorite }) {
  return (
    <div className="food-card fade-in" style={{ position: "relative" }}>
      {onToggleFavorite && (
        <button 
          onClick={() => onToggleFavorite(food._id)}
          style={{
            position: "absolute", top: "10px", right: "10px", zIndex: 2,
            background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
            width: "36px", height: "36px", cursor: "pointer",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.2rem", transition: "transform 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      )}
      <img
        className="food-card-img"
        src={food.image_url}
        alt={food.name}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_IMAGE;
        }}
      />
      <div className="food-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="food-card-cat">{food.category}</div>
          {food.reviewCount > 0 && (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
              <span style={{ color: "gold" }}>★</span>
              <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>{food.averageRating}</span>
              <span>({food.reviewCount})</span>
            </div>
          )}
        </div>
        <div className="food-card-name">{food.name}</div>
        <div className="food-card-footer">
          <span className="food-price">₹{food.price}</span>
          <button className="add-btn" onClick={() => onAdd(food)}>
            ➕ Add
          </button>
        </div>
      </div>
    </div>
  );
}
