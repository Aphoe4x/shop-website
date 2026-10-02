# Shopping - Nigerian E-Commerce Website

A full-stack e-commerce website with a Nigerian aesthetic, built with React, Node.js, Supabase, Mailgun, and Google Auth.

## Features

- **Product Catalog** — Browse products with categories (Fashion, Food, Electronics, Beauty, Home, Kids)
- **Shopping Cart** — Add/remove items, quantity management (persisted in localStorage)
- **Checkout** — Shipping details form with order summary
- **Google Auth** — Sign in with Google account
- **Order Confirmation Emails** — Sent via Mailgun
- **Database** — All data stored in Supabase (PostgreSQL)
- **Nigerian Design** — Green/gold color scheme, Naira currency, Nigerian cities

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Email | Mailgun |
| Auth | Google OAuth 2.0 |

## Project Structure

```
shop-website/
├── AGENTS.md              # Continuation notes for coding agents
├── PRD.md                 # Product and phase overview
├── client/                # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Navbar, ProductCard
│   │   ├── context/        # CartContext, AuthContext
│   │   ├── pages/          # Home, ProductDetail, Checkout, Login, Orders
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       # Nigerian-themed styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Environment config
│   │   ├── routes/         # auth, products, orders
│   │   ├── services/       # supabase, mailgun, googleAuth
│   │   └── index.js        # Entry point
│   ├── .env.example
│   └── package.json
├── supabase-schema.sql    # Database schema + sample data
├── update-images.sql      # Optional image-related SQL updates
├── README.md
└── .gitignore
```

## Setup Instructions

### 1. Clone and Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** in the dashboard
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to create all tables and sample data
6. Go to **Settings > API** and copy your:
   - Project URL (`SUPABASE_URL`)
   - Anon public key (`SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`)

### 3. Set Up Mailgun (Email)

1. Go to [mailgun.com](https://www.mailgun.com) and create a free account
2. Verify your domain (or use the sandbox domain for testing)
3. Go to **Settings > API Keys** and copy your private API key
4. Note your domain (e.g., `mg.yourdomain.com`)
5. Add these to your `.env`:
   ```
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_FROM_EMAIL=Shopping <noreply@yourdomain.com>
   ```

> **Sending to third parties:** Mailgun's free **sandbox domain** can only
> send to up to 5 **authorized recipients**. To email *any* customer you must
> verify a domain you own (add its SPF/DKIM/CNAME/MX records in Mailgun →
> Domains → Add Domain). The free plan includes one custom domain.

**Optional local fallback (not the required provider):** to send without a
domain during development, set `EMAIL_PROVIDER=gmail` and provide a Gmail
address + App Password:
```
EMAIL_PROVIDER=gmail
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```
Mailgun remains the default and the required integration.

### 4. Set Up Google Auth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure the consent screen (External, add your email)
6. Set authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**
8. Add these to your `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
   ```

### 5. Configure Environment Variables

```bash
# In server/ directory
cp .env.example .env
# Edit .env with your actual API keys
```

### 6. Run the Application

```bash
# Terminal 1: Start backend (from server/ directory)
npm run dev

# Terminal 2: Start frontend (from client/ directory)
npm run dev
```

The frontend will be at `http://localhost:5173` and the backend at `http://localhost:3001`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:email` | Get orders by email |
| GET | `/api/auth/google` | Redirect to Google login |
| GET | `/api/auth/google/callback` | Google auth callback |
| GET | `/api/health` | Health check |

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Backend (Render/Railway)
```bash
cd server
# Set environment variables in your hosting platform
npm start
```

### Update URLs
After deployment, update:
- `CLIENT_URL` in `server/.env` to your frontend URL
- `GOOGLE_REDIRECT_URI` in `server/.env` to your backend URL
- Google Cloud Console redirect URI
- Supabase CORS settings

## License

MIT
