# Silver Thief Bug Project

- [x] **Phase 1: Foundation & Design System**
    - [x] Install dependencies (Supabase, Stripe, Tailwind, SweetAlert2, React Router)
    - [x] Setup Tailwind configuration for 60/30/10 (Silver/White/Orange)
    - [x] Create layout components (Navbar, Footer, Modal)
    - [x] Setup Environment variables template (.env.example — frontend & backend)

- [x] **Phase 2: Database & Authentication**
    - [x] Initialize Supabase Client (`frontend/src/lib/supabaseClient.ts`)
    - [x] Design and set up DB tables (`backend/src/db/schema.sql` — products, profiles, orders, favorites)
    - [x] Implement Login/Signup form with validation (`frontend/src/pages/Login.tsx`)
    - [x] Implement user session and role-based access (`AuthContext` + `requireAdmin` middleware)

- [x] **Phase 3: Core Features (User-Facing)**
    - [x] HomePage: Modern layout with beetle knowledge and Facebook links
    - [x] Product Page: Listing cards with filter/search and detailed modal
    - [x] Favorites: Add/Remove logic and Product Fav page (`FavoritesContext` + `Favorites.tsx`)
    - [x] Cart: State management and slide-over menu (`CartContext` + `Cart.tsx`)
    - [x] Notification Modal: Top-right toast alerts (`NotificationToast.tsx`)

- [ ] **Phase 4: Admin Dashboard**
    - [ ] Setup Dashboard charts (Sales, Views, Stock)
    - [ ] Create product management table (CRUD)
    - [ ] Implement "Best Seller" toggle functionality

- [ ] **Phase 5: Payment & External Integration**
    - [x] Integrate Stripe routes (QR Code & Credit Card) — backend ready
    - [ ] Connect Stripe frontend (StripeElements checkout page)
    - [x] Status check: Real-time update on money received (webhook handler)
    - [x] Implement Line OA notification on Order Success (backend route)
    - [x] SweetAlert2 for all feedback (Success/Error)

- [ ] **Phase 6: Final Polish & Security**
    - [ ] Implement encryption/security best practices
    - [ ] Performance audit: Image optimization and code splitting
    - [ ] Responsive UI check (Mobile, Tablet, Desktop)

---

## Project Structure

```
SilverTBProject/
├── backend/                      ← Node.js/Express API
│   ├── server.js
│   ├── .env.example
│   └── src/
│       ├── config/supabase.js    ← Supabase service-role client
│       ├── middleware/auth.js    ← JWT + role guard
│       ├── routes/
│       │   ├── auth.js           ← signup, login, /me
│       │   ├── products.js       ← CRUD + filters + best-sellers
│       │   ├── orders.js         ← order creation & status management
│       │   ├── payments.js       ← Stripe PaymentIntent + PromptPay QR + webhook
│       │   └── notifications.js  ← Line OA push & broadcast
│       └── db/schema.sql         ← Supabase tables + RLS policies
│
└── frontend/                     ← React/TypeScript CRA app
    ├── .env.example
    └── src/
        ├── lib/
        │   ├── supabaseClient.ts
        │   └── api.ts            ← Typed fetch wrapper with auth header
        ├── contexts/
        │   ├── AuthContext.tsx
        │   ├── CartContext.tsx
        │   └── FavoritesContext.tsx
        ├── pages/
        │   ├── Home.tsx          ← Hero, beetle facts, Facebook links, CTA
        │   ├── Products.tsx      ← Filter/search grid + detail modal + cart
        │   ├── Favorites.tsx     ← Saved beetles with add-to-cart
        │   ├── Cart.tsx          ← Slide-over cart panel
        │   └── Login.tsx         ← Sign in / Sign up with validation
        └── component/
            ├── layout/
            │   ├── Navbar.tsx    ← Auth-aware, cart badge, favorites badge
            │   └── Footer.tsx
            └── common/
                ├── Modal.tsx
                └── NotificationToast.tsx ← Top-right toast system

```

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your Supabase, Stripe, Line keys
npm run dev            # starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in REACT_APP_SUPABASE_URL, ANON_KEY, API_URL
npm start              # starts on port 3000
```
