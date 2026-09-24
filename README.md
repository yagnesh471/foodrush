# FoodRush 🍔 — Regenerated

A full regeneration of the FoodRush food-delivery demo app: React frontend,
ES6/MVC backend, and fixes for the delivery-tracking, address-storage, and
checkout-friction issues in the original.

## What changed and why

### 1. Delivery tracking no longer depends on the browser tab being open
**Before:** `tracking.html` ran a `setTimeout`/`setInterval` chain in the
browser to move the order through "Preparing → Out for Delivery →
Delivered" and to count down the ETA. If you closed the tab, the order's
status never advanced — because nothing in the backend was tracking time.

**Now:** every order stores its `createdAt` timestamp, and
`backend/src/services/orderTrackingService.js` derives the *true* status
purely from elapsed wall-clock time:

- 0s → Order Placed
- 15s → Preparing
- 35s → Out for Delivery
- 60s → Delivered

This runs on the server every time an order is read (tracking page, order
history, admin dashboard) and persists the result. So even if you close
tracking immediately and don't look again for an hour, the very next
request reports (and saves) "Delivered" — it's never stuck waiting for a
browser tab. An admin manually changing a status locks out the automatic
clock for that order (`autoProgress: false`), so a human decision is
never silently overwritten.

The timings are configurable via `ORDER_PREPARING_AFTER_SECONDS`,
`ORDER_OUT_FOR_DELIVERY_AFTER_SECONDS`, and
`ORDER_DELIVERED_AFTER_SECONDS` in the backend `.env`.

### 2. Addresses are stored on the server, not `localStorage`
**Before:** saved addresses lived only in the browser's `localStorage` —
gone if you cleared site data or switched devices, and not tied to your
account at all.

**Now:** `User.addresses` in MongoDB, exposed through authenticated
`/api/addresses` endpoints (`GET/POST/PATCH/DELETE`). Every order also
keeps a snapshot of the address used, so editing/deleting a saved address
later never changes historical orders.

### 3. Placing an order is a single, obvious flow
**Before:** you had to save an address, then separately click it to
"select" it, then fill out card-detail fields that weren't even sent to
the backend, before the pay button would work.

**Now:** the first address you save is automatically selected (and
becomes your default); any existing default is preselected when you
reach checkout. Cash on Delivery is the default payment method — the
fastest path with nothing to type — and switching methods is a single
click.

### 4. Backend architecture
Rebuilt as ES6 modules throughout, in a standard MVC layout:

```
backend/src/
  config/       env loading + validation, DB connection
  models/       User, Food, Order (mongoose, ES6)
  middleware/   requireAuth / requireAdmin (real JWT verification),
                rate limiters, central error handler
  services/     emailService, orderTrackingService
  controllers/  one per resource, thin, all wrapped in asyncHandler
  routes/       one per resource
  app.js        express app factory
  server.js     entrypoint
```

Notably, **order and address routes previously trusted a plain
`username` string sent in the request body** — anyone could read another
user's addresses or place an order "as" someone else just by naming
them. Every user-scoped route now goes through `requireAuth`, which
verifies the JWT and resolves the *actual* logged-in user.

### 5. Frontend: converted to React
Vite + React Router SPA under `frontend/`, replacing the old
multi-page vanilla-JS site:

```
frontend/src/
  api/          fetch client + grouped endpoint functions
  context/      Auth, AdminAuth, Cart, Toast
  components/   Navbar, FoodCard, CartSidebar, AddressManager,
                StatusTimeline, OrderHistoryModal, route guards
  pages/        Login, Signup, ForgotPassword, Home, Payment,
                Tracking, Admin
```

The original CSS design (dark theme, cards, gradients) was kept — it's
reused as-is in `src/styles/style.css`.

## Running it

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, ADMIN_USERNAME/PASSWORD, SMTP_*
npm install
npm run dev             # nodemon, http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env   # set VITE_API_BASE_URL if not localhost:5000
npm install
npm run dev              # http://localhost:5173
```

Sign up (OTP email required — configure SMTP in the backend `.env`,
e.g. Brevo's free SMTP relay), verify, log in, and order away. Admin
panel is at `/admin`, using `ADMIN_USERNAME`/`ADMIN_PASSWORD` from the
backend `.env`.
