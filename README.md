# FoodRush - Online Food Delivery Project

## Structure

```text
FoodRush_Ready/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/
    ├── js/
    ├── index.html
    ├── signup.html
    ├── forgot-password.html
    ├── home.html
    ├── payment.html
    ├── tracking.html
    └── admin.html
```

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Set real values in `.env` before running.

## Frontend setup

Open `frontend/index.html` using Live Server.

For deployment, replace this value in `frontend/js/api.js`:

```js
"https://your-render-backend.onrender.com/api"
```

with your actual Render backend URL.
