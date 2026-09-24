import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAdminAuth } from "../context/AuthContext.jsx";
import { adminApi, foodApi } from "../api/endpoints.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatDate, statusBadgeClass } from "../utils/format.js";

const ORDER_STATUSES = ["Order Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
const FOOD_CATEGORIES = ["Burgers", "Pizza", "Indian", "Wraps", "Drinks", "Desserts", "Other"];

export default function AdminPage() {
  const { isAdminLoggedIn, login, logout } = useAdminAuth();

  if (!isAdminLoggedIn) return <AdminLogin onLogin={login} />;
  return <AdminDashboard onLogout={logout} />;
}

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      return setError("Enter admin username and password.");
    }

    setSubmitting(true);
    try {
      const data = await adminApi.login({ username: username.trim(), password });
      onLogin(data.token);
      showToast("Welcome, Admin! 🎉", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-logo">
          <span className="logo-icon">⚙️</span>
          <h1>Admin Panel</h1>
          <p>FoodRush Management System</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Admin Login 🔐</h2>
          <p className="auth-subtitle">Secure access for administrators only</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <label className="form-label">👤 Username</label>
              <input className="form-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter admin username" />
            </div>
            <div className="form-group">
              <label className="form-label">🔒 Password</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? "Checking..." : "⚙️ Enter Admin Panel"}
            </button>
          </form>

          <p className="auth-footer">
            <Link to="/login">← Back to User Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newFood, setNewFood] = useState({ name: "", category: "", price: "", image_url: "" });
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [foodError, setFoodError] = useState("");
  const [addingFood, setAddingFood] = useState(false);
  const { showToast } = useToast();

  const loadAll = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([adminApi.stats(), adminApi.orders()]);
      setStats(statsData);
      setOrders(ordersData);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const loadFoods = async () => {
    try {
      setFoods(await foodApi.list());
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  useEffect(() => {
    loadAll();
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    onLogout();
    showToast("Admin logged out successfully.", "info");
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    setFoodError("");

    const { name, category, image_url } = newFood;
    const price = parseInt(newFood.price, 10);

    if (!name.trim() || !category || !image_url.trim() || !price) {
      setFoodError("Please fill in all fields.");
      return;
    }

    setAddingFood(true);
    try {
      if (editingFoodId) {
        await adminApi.updateFood(editingFoodId, { name: name.trim(), category, price, image_url: image_url.trim() });
        showToast(`"${name}" updated successfully! ✅`, "success");
      } else {
        await adminApi.addFood({ name: name.trim(), category, price, image_url: image_url.trim() });
        showToast(`"${name}" added successfully! ✅`, "success");
      }
      setNewFood({ name: "", category: "", price: "", image_url: "" });
      setEditingFoodId(null);
      loadFoods();
      loadAll();
    } catch (err) {
      setFoodError(err.message);
    } finally {
      setAddingFood(false);
    }
  };

  const handleEditClick = (food) => {
    setNewFood({ name: food.name, category: food.category, price: food.price.toString(), image_url: food.image_url });
    setEditingFoodId(food._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteFood = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteFood(id);
      showToast(`"${name}" deleted.`, "info");
      loadFoods();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    if (!status) return;
    try {
      await adminApi.updateOrderStatus(orderId, status);
      showToast(`Order updated: ${status} ✅`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <nav className="navbar">
        <span className="navbar-brand">⚙️ Admin Panel</span>
        <ul className="navbar-nav">
          <li>
            <Link to="/login">👤 User App</Link>
          </li>
        </ul>
        <div className="navbar-user">
          <span className="user-badge">🛡️ admin</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="admin-wrapper">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem" }}>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard & Orders
          </button>
          <button 
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('menu')}
          >
            🍔 Menu Management
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <h2 className="section-title">📊 Dashboard</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🍔</div>
            <div className="stat-value">{stats.totalFoods || 0}</div>
            <div className="stat-label">Total Foods</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{stats.totalOrders || 0}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{stats.todaysOrders || 0}</div>
            <div className="stat-label">Today's Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.deliveredOrders || 0}</div>
            <div className="stat-label">Delivered Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{stats.cancelledOrders || 0}</div>
            <div className="stat-label">Cancelled Orders</div>
          </div>
          <div className="stat-card" style={{ background: "rgba(6, 214, 160, 0.1)", borderColor: "var(--accent)" }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value" style={{ color: "var(--accent)" }}>₹{stats.totalRevenue || 0}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        <div className="admin-grid" style={{ marginBottom: "2rem" }}>
          <div className="admin-panel">
            <h3 className="panel-title">🔥 Popular Food Items</h3>
            {stats.popularFoods?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th style={{ textAlign: "right" }}>Units Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.popularFoods.map(food => (
                    <tr key={food.name}>
                      <td>{food.name}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold" }}>{food.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Not enough data yet.</p>
            )}
          </div>

          <div className="admin-panel">
            <h3 className="panel-title">📅 Daily Revenue & Orders (Last 7 Days)</h3>
            {stats.dailyStats?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ height: 250 }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>Revenue Trend</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ height: 250 }}>
                  <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>Orders Volume</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-primary)" }} />
                      <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Not enough data yet.</p>
            )}
          </div>
        </div>

          </>
        )}

        {activeTab === 'menu' && (
          <div className="admin-grid">
            <div className="admin-panel">
              <h3 className="panel-title">{editingFoodId ? "✏️ Edit Food Item" : "➕ Add Food Item"}</h3>
              {foodError && <div className="alert alert-error">{foodError}</div>}

              <form onSubmit={handleAddFood}>
                <div className="form-group">
                  <label className="form-label">🍽️ Food Name</label>
                  <input className="form-input" type="text" placeholder="e.g. Spicy Noodles" value={newFood.name} onChange={(e) => setNewFood({ ...newFood, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">📂 Category</label>
                  <select className="form-input" value={newFood.category} onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}>
                    <option value="">Select category</option>
                    {FOOD_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">💰 Price (₹)</label>
                  <input className="form-input" type="number" min={1} placeholder="e.g. 199" value={newFood.price} onChange={(e) => setNewFood({ ...newFood, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">🖼️ Image URL</label>
                  <input className="form-input" type="url" placeholder="https://..." value={newFood.image_url} onChange={(e) => setNewFood({ ...newFood, image_url: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button className="btn btn-success" type="submit" disabled={addingFood} style={{ flex: 1 }}>
                    {addingFood ? "Saving..." : (editingFoodId ? "💾 Save Changes" : "➕ Add Food Item")}
                  </button>
                  {editingFoodId && (
                    <button type="button" className="btn btn-secondary" onClick={() => { setEditingFoodId(null); setNewFood({ name: "", category: "", price: "", image_url: "" }); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="admin-panel">
              <h3 className="panel-title">
                🍔 Food Items <span style={{ fontSize: "0.8rem", background: "var(--input-bg)", padding: "2px 8px", borderRadius: "50px" }}>{foods.length} items</span>
              </h3>
              <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          No food items.
                        </td>
                      </tr>
                    )}
                    {foods.map((f) => (
                      <tr key={f._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <img src={f.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                            {f.name}
                          </div>
                        </td>
                        <td>{f.category}</td>
                        <td style={{ fontWeight: 700, color: "var(--secondary)" }}>₹{f.price}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(f)}>
                              ✏️ Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFood(f._id, f.name)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="admin-panel" style={{ marginBottom: "2rem" }}>
            <h3 className="panel-title">📦 All Orders</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ minWidth: "760px" }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      No orders yet.
                    </td>
                  </tr>
                )}
                {orders.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>{o.orderId}</td>
                    <td>
                      <div>👤 {o.username}</div>
                      {o.specialInstructions && (
                        <div style={{ fontSize: "0.8rem", color: "var(--accent)", marginTop: "0.25rem" }}>
                          📝 Note: {o.specialInstructions}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--secondary)" }}>₹{o.totalPrice}</td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass(o.status)}`}>{o.status}</span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDate(o.createdAt)}</td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", width: "auto" }}
                        defaultValue=""
                        onChange={(e) => handleStatusChange(o.orderId, e.target.value)}
                      >
                        <option value="">Change status...</option>
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      <footer className="site-footer">© 2026 FoodRush | Built with ❤️ by the FoodRush Team</footer>
    </div>
  );
}
