const SESSION_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

window.SESSION = {
  cart: JSON.parse(localStorage.getItem("foodrush_cart") || "[]"),
  pendingOrderId: sessionStorage.getItem("foodrush_pending_order") || null,
};

function persistCart() {
  localStorage.setItem("foodrush_cart", JSON.stringify(window.SESSION.cart));
}

function savePendingOrderId(orderId) {
  window.SESSION.pendingOrderId = orderId;
  sessionStorage.setItem("foodrush_pending_order", orderId);
}

function clearPendingOrderId() {
  window.SESSION.pendingOrderId = null;
  sessionStorage.removeItem("foodrush_pending_order");
}

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("foodrush_user") || "null");
}

function isLoggedIn() {
  const token = localStorage.getItem("foodrush_token");
  const user = getLoggedInUser();
  const loginAt = Number(localStorage.getItem("foodrush_login_at") || 0);

  if (!token || !user || !loginAt) return false;

  if (Date.now() - loginAt > SESSION_LIMIT_MS) {
    sessionLogout(false);
    return false;
  }

  return true;
}

function isAdminLoggedIn() {
  const token = localStorage.getItem("foodrush_admin_token");
  const loginAt = Number(localStorage.getItem("foodrush_admin_login_at") || 0);
  return !!token && !!loginAt && Date.now() - loginAt <= SESSION_LIMIT_MS;
}

function protectUserPage() {
  if (!isLoggedIn()) {
    window.location.replace("index.html");
    return false;
  }

  history.pushState(null, null, location.href);
  window.onpopstate = function () {
    history.go(1);
  };

  return true;
}

function currentUsername() {
  return getLoggedInUser()?.username || "";
}

function sessionLogin(user, token) {
  localStorage.setItem("foodrush_user", JSON.stringify(user));
  localStorage.setItem("foodrush_token", token);
  localStorage.setItem("foodrush_login_at", String(Date.now()));
}

function adminSessionLogin(token) {
  localStorage.setItem("foodrush_admin_token", token);
  localStorage.setItem("foodrush_admin_login_at", String(Date.now()));
}

function sessionLogout(redirect = true) {
  localStorage.removeItem("foodrush_user");
  localStorage.removeItem("foodrush_token");
  localStorage.removeItem("foodrush_login_at");
  localStorage.removeItem("foodrush_cart");
  localStorage.removeItem("foodrush_addresses");
  sessionStorage.removeItem("foodrush_pending_order");
  window.SESSION.cart = [];
  window.SESSION.pendingOrderId = null;
  if (redirect) window.location.replace("index.html");
}

function adminLogout() {
  localStorage.removeItem("foodrush_admin_token");
  localStorage.removeItem("foodrush_admin_login_at");
  window.location.replace("index.html");
}

function cartAdd(food) {
  const existing = window.SESSION.cart.find((item) => item.food._id === food._id);
  if (existing) existing.quantity += 1;
  else window.SESSION.cart.push({ food, quantity: 1 });
  persistCart();
}

function cartRemove(foodId) {
  const item = window.SESSION.cart.find((entry) => entry.food._id === foodId);
  if (!item) return;
  if (item.quantity > 1) item.quantity -= 1;
  else window.SESSION.cart = window.SESSION.cart.filter((entry) => entry.food._id !== foodId);
  persistCart();
}

function cartClear() {
  window.SESSION.cart = [];
  persistCart();
}

function cartCount() {
  return window.SESSION.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal() {
  return window.SESSION.cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
}

function cartGST(subtotal) {
  return Math.round(subtotal * 0.05);
}

function cartGrandTotal() {
  const subtotal = cartTotal();
  return subtotal + cartGST(subtotal) + 40;
}

function generateOrderId() {
  return `ORD${Date.now()}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadgeClass(status) {
  switch (status) {
    case "Order Placed": return "status-placed";
    case "Preparing": return "status-preparing";
    case "Out for Delivery": return "status-delivery";
    case "Delivered": return "status-delivered";
    case "Cancelled": return "status-cancelled";
    default: return "";
  }
}

function showAlert(containerId, message, type = "info") {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(containerId) {
  const box = document.getElementById(containerId);
  if (box) box.innerHTML = "";
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-icon">${icons[type] || icons.info}</div><div class="toast-msg">${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showLoading(message = "Loading...") {
  if (document.querySelector(".loading-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "loading-overlay";
  overlay.innerHTML = `<div class="spinner"></div><div class="loading-text">${message}</div>`;
  document.body.appendChild(overlay);
}

function hideLoading() {
  document.querySelector(".loading-overlay")?.remove();
}

function renderNavbar(activePage = "home") {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  const username = currentUsername();
  navbar.innerHTML = `
    <a href="home.html" class="navbar-brand">🍔 FoodRush</a>
    <ul class="navbar-nav">
      <li><a href="home.html" class="${activePage === "home" ? "active" : ""}">Menu</a></li>
      <li><a href="#" onclick="openOrderHistory(); return false;">Orders</a></li>
      <li><a href="tracking.html" class="${activePage === "tracking" ? "active" : ""}">Tracking</a></li>
    </ul>
    <div class="navbar-user">
      <span class="user-badge">👤 ${username || "Guest"}</span>
      <button class="btn btn-secondary btn-sm" onclick="sessionLogout()">🚪 Logout</button>
    </div>`;
}

function openOrderHistory() {
  if (typeof renderOrderHistoryModal === "function")
    renderOrderHistoryModal();
}
function getSavedAddresses() {
  return JSON.parse(
    localStorage.getItem("foodrush_addresses") || "[]"
  );
}

function saveAddresses(addresses) {
  localStorage.setItem(
    "foodrush_addresses",
    JSON.stringify(addresses)
  );
}

function saveAddressLocally() {

  const type =
    document.getElementById("address-type").value;

  const fullAddress =
    document.getElementById("full-address")
      .value
      .trim();

  const landmark =
    document.getElementById("landmark")
      .value
      .trim();

  if (!fullAddress) {
    showToast("Please enter address", "error");
    return;
  }

  const addresses = getSavedAddresses();

  const address = {
    id: Date.now(),
    type,
    fullAddress,
    landmark,
  };

  addresses.push(address);

  saveAddresses(addresses);

  renderSavedAddresses();

  showToast(
    "Address saved successfully",
    "success"
  );
}

function renderSavedAddresses() {

  const container =
    document.getElementById("saved-addresses");

  if (!container) return;

  const addresses = getSavedAddresses();

  if (!addresses.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <h4 style="margin-bottom:1rem;">
      Saved Addresses
    </h4>

    ${addresses.map(addr => `
      <div
        class="saved-address-card"
        onclick="selectAddress(${addr.id})"
        id="address-${addr.id}"
      >

        <div style="font-weight:700;">
          ${addr.type}
        </div>

        <div style="margin-top:0.5rem;">
          ${addr.fullAddress}
        </div>

        <div style="color:var(--text-muted);margin-top:0.3rem;">
          ${addr.landmark || ""}
        </div>

      </div>
    `).join("")}
  `;
}

window.selectedAddress = null;

function selectAddress(id) {

  document
    .querySelectorAll(".saved-address-card")
    .forEach(el => el.classList.remove("selected"));

  document
    .getElementById(`address-${id}`)
    .classList.add("selected");

  window.selectedAddress =
    getSavedAddresses().find(
      addr => addr.id === id
    );
}a
