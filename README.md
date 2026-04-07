# 🎨 KalaSetu — India's Premier Cultural Marketplace

> **"Kala Setu"** means *The Bridge of Art* in Sanskrit.  
> A production-grade digital ecosystem connecting Indian artisans with global art enthusiasts.

KalaSetu is more than a marketplace — it is a community-driven platform for discovering authentic Indian art, participating in live auctions, attending cultural workshops, and engaging in deep discussions about India's heritage.

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [User Roles](#5-user-roles)
6. [Features — Completed](#6-features--completed)
7. [Features — In Progress](#7-features--in-progress)
8. [Features — Planned](#8-features--planned)
9. [User Flows](#9-user-flows)
10. [Role-Based Dashboards](#10-role-based-dashboards)
11. [Database Design](#11-database-design)
12. [Design System](#12-design-system)
13. [How to Run](#13-how-to-run)

---

## 1. Project Overview

KalaSetu addresses the fragmentation in the Indian art market by providing:

| Module | Description |
|--------|-------------|
| 🖼️ **Art Marketplace** | Curated space for paintings, sculptures, textiles, and digital art |
| ⚡ **Live Bidding** | Real-time auction system for exclusive masterpieces |
| 💬 **Charcha Sabha** | Community forum for artists and collectors |
| 📅 **Kalent** | Hub for cultural workshops, exhibitions, and competitions |
| 💰 **Wallet** | Integrated wallet with Razorpay top-up and escrow-backed payments |
| 🔍 **KYC** | Identity verification workflow for buyers and artists |
| 🎫 **Support** | Ticket-based customer support with agent assignment |

---

## 2. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 16.2.1 | App Router, SSR, static generation, dynamic routing |
| React | 19.2.4 | UI rendering |
| TypeScript | 5.x | End-to-end type safety |
| Supabase JS | 2.x | Database queries, authentication, real-time |
| CSS Modules + Global CSS | — | Scoped styles with a shared dark-theme design system |
| React Context | — | Auth state, role switching, session persistence |

> The `server/` folder contains a legacy Express + Prisma backend that is no longer used by the frontend. The client talks directly to Supabase.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js 16)                      │
│  App Router  │  CSS Modules  │  Supabase JS  │  React Context│
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (Supabase REST + Auth API)
┌──────────────────────────▼──────────────────────────────────┐
│                      SUPABASE                                │
│  Auth (email/password)  │  PostgREST API  │  Row-Level Sec  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    POSTGRESQL (Supabase)                     │
│  15+ relational models  │  PascalCase table names           │
└─────────────────────────────────────────────────────────────┘
```

**Auth Flow:**
1. User signs up / logs in via `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()`.
2. Supabase issues a session (JWT stored internally by the SDK — no manual token management).
3. On signup, a `User` row and a `Wallet` row are created in the database.
4. `AuthContext` listens to `supabase.auth.onAuthStateChange()` and fetches the user profile from the `User` table.
5. Role is stored in the `User` table (`role` column). Multi-role users have a `roles` array column.
6. Role switching updates the `User` table directly via a Supabase query.

---

## 4. Project Structure

```
KalaSetu-Web/
│
├── client/                          # Next.js Frontend (active)
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx       # Shared sidebar layout
│   │   │   │   ├── artist/          # Artist Studio dashboard
│   │   │   │   ├── customer/        # Customer dashboard
│   │   │   │   ├── admin/           # Admin Console dashboard
│   │   │   │   ├── manager/         # Manager dashboard
│   │   │   │   ├── support/         # Support Center dashboard
│   │   │   │   └── delivery/        # Delivery dashboard
│   │   │   ├── explore/             # Art marketplace browse
│   │   │   ├── bid/                 # Live auction listing + [id] detail
│   │   │   ├── art/[id]/            # Artwork detail page
│   │   │   ├── artist/              # Artist profile + add-artwork
│   │   │   ├── artist-dashboard/    # Artwork management (artist)
│   │   │   ├── kalent/              # Events, competitions, workshops
│   │   │   ├── charcha/             # Community forum
│   │   │   ├── wallet/              # Wallet & payments
│   │   │   ├── profile/             # User profile & KYC
│   │   │   ├── messages/            # Messaging
│   │   │   ├── orders/              # Order history
│   │   │   ├── wishlist/            # Saved artworks
│   │   │   ├── login/               # Auth — Sign In
│   │   │   └── signup/              # Auth — Register
│   │   ├── components/
│   │   │   ├── cards/               # ArtCard, ArtistCard, BidCard, EventCard, DiscussionCard
│   │   │   └── layout/              # Navbar, Footer, BottomNav
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Supabase session, user state, role switching
│   │   ├── hooks/
│   │   │   ├── useRequireAuth.ts    # Redirect if unauthenticated
│   │   │   └── useRequireRole.ts    # Redirect if wrong role
│   │   ├── lib/
│   │   │   ├── supabase.ts          # Supabase client singleton (lazy init)
│   │   │   ├── api.ts               # Compatibility layer — maps route patterns to Supabase queries
│   │   │   ├── authToken.ts         # Token helpers (legacy, unused — Supabase manages sessions)
│   │   │   └── payment.ts           # Razorpay checkout stub (needs Edge Functions)
│   │   └── types/
│   │       └── index.ts             # Shared TypeScript types
│   ├── public/                      # Static assets
│   ├── env.example                  # Env template
│   └── package.json
│
├── server/                          # Legacy Express Backend (not used by frontend)
│   ├── src/
│   │   ├── index.ts                 # App entry — registers all routes
│   │   ├── config/
│   │   │   ├── db.ts                # Prisma client singleton
│   │   │   └── env.ts               # Env validation
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts   # authenticate + authorize(roles[])
│   │   └── modules/
│   │       ├── auth/                # signup, login, refresh, switch-role
│   │       ├── artworks/            # CRUD, mine, status management
│   │       ├── bids/                # create, active, place
│   │       ├── bid-requests/        # open, create, accept, complete
│   │       ├── orders/              # create, my, status updates, timeline
│   │       ├── payments/            # Razorpay create-order, verify, history
│   │       ├── wallet/              # balance, transactions
│   │       ├── users/               # profile, artists, dashboard-stats
│   │       ├── kyc/                 # submit, verify, status
│   │       ├── support/             # tickets, assign, status
│   │       ├── delivery/            # my deliveries, status updates
│   │       ├── events/              # Kalent events
│   │       └── discussions/         # Charcha forum
│   ├── prisma/
│   │   └── schema.prisma            # Full DB schema (15+ models)
│   └── package.json
│
└── README.md                        # This file
```

---

## 5. User Roles

| Role | Access Level | Primary Purpose |
|------|-------------|-----------------|
| `CUSTOMER` | Standard | Browse, buy, bid, wishlist, support tickets |
| `ARTIST` | Standard | All of CUSTOMER + list artworks, create bids, view earnings |
| `ADMIN` | Super | Full platform control — user management, KYC review, escrow, all management |

> **Multi-role**: Users can hold multiple roles simultaneously. The active role is switchable via the dashboard selector.  
> **Signup**: Users register as `CUSTOMER` or `ARTIST` via `/signup`. Admin accounts are created directly in Supabase.

---

## 6. Features — Completed

### 🔐 Authentication & Authorization
- Email/password auth via **Supabase Auth** (`signUp`, `signInWithPassword`, `signOut`)
- Session managed entirely by Supabase JS SDK — no manual token handling
- `AuthContext` listens to `onAuthStateChange` and fetches user profile from the `User` table
- Role stored in the `User` table; role switching updates it directly
- `useRequireAuth` and `useRequireRole` hooks guard all protected pages

### 🖼️ Artwork Management
- Artists can create, edit, and delete artwork listings
- Status workflow: `DRAFT` → `PENDING_REVIEW` → `LISTED` → `SOLD`
- `/artworks/mine` returns only the current artist's artworks
- Artworks support category, medium, dimensions, and images

### ⚡ Bidding System (Auctions)
- Artists create bid auctions via `POST /bids` (starting price, min increment, datetime range)
- `GET /bids/active` returns **both ACTIVE and UPCOMING** bids
- Date fields use `z.coerce.date()` for reliable parsing from `datetime-local` inputs
- Customers place bids via `POST /bids/:id/place` — validated against `currentHighest + minIncrement`
- Role-aware Bid page: customers see bid cards; artists additionally see a **"+ Start a Bid"** modal with artwork dropdown and datetime pickers

### 💰 Wallet & Payments (Razorpay)
- Razorpay order creation → frontend checkout → backend cryptographic signature verification
- Successful payment atomically updates wallet balance or marks order as paid
- Wallet top-up, balance display, hold balance tracking, and full transaction history

### 📦 Orders
- Orders created on successful artwork purchase
- `GET /orders/my` returns role-filtered orders
- Order status progression: `PENDING → CONFIRMED → SHIPPED → DELIVERED → COMPLETED`
- Order timeline endpoint for status history

### 🔍 KYC (Identity Verification)
- Users submit KYC documents (PAN + Aadhaar)
- Status workflow: `NOT_STARTED → PENDING → VERIFIED / FAILED`
- KYC status alert banner shown in Customer dashboard when not VERIFIED

### 🎫 Support Tickets
- Customers create support tickets linked to orders
- Support agents see all tickets; filterable by `OPEN / IN_PROGRESS / RESOLVED / ALL`
- Per-ticket actions: **Assign to Me**, **Start Working**, **Mark Resolved**, **Reopen**
- Priority levels: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### 📊 Dashboard Stats
- Single Supabase query returns: total users, total artworks, total orders, total revenue, active bids, open tickets, pending KYC, last 10 orders, and users grouped by role
- Used by Admin and Manager dashboards

### 🏠 Role-Optimised Dashboards
Each role gets a purpose-built dashboard with KPI cards, alert banners, and two-column layouts (see [Section 10](#10-role-based-dashboards)).

### 🎨 Design System
- Dark theme with CSS variables (`--saffron`, `--royal-purple`, `--teal`, `--gold`)
- Global utility classes: `btn`, `badge`, `stat-card`, `empty-state`, `card`, `input-field`
- Dashboard CSS module classes for grids, alerts, tables, and action cards

---

## 7. Features — In Progress

| Feature | Status | Notes |
|---------|--------|-------|
| Razorpay Payments | 🔄 Stub | Currently throws a helpful error; needs Supabase Edge Functions to call Razorpay server-side |
| Order Checkout UX | 🔄 Partial | Order creation works; shipping address + tracking UI pending |
| Charcha (Discussion Forum) | 🔄 Partial | Supabase queries wired; frontend pages partially built |
| Kalent (Events) | 🔄 Partial | Event listing works; registration flow in progress |
| Delivery Dashboard | 🔄 Partial | Basic status progression; full workflow pending |
| Bid Requests | 🔄 Partial | Open requests + artist bidding works; full lifecycle incomplete |
| Row-Level Security | 🔄 Pending | RLS policies need to be applied in Supabase dashboard for production security |

---

## 8. Features — Planned

| Feature | Priority | Description |
|---------|----------|-------------|
| Razorpay via Edge Functions | High | Move Razorpay order creation + signature verification to Supabase Edge Functions |
| Real-time Notifications | High | Supabase Realtime for outbid alerts, order updates, event reminders |
| Row-Level Security Policies | High | Enforce per-user data access rules in Supabase for production |
| Image Uploads | Medium | Supabase Storage for artist portfolio and artwork images |
| Admin Analytics Charts | Medium | Revenue trends, user growth, bid activity graphs |
| Artist Verification Badge | Low | Approved artists get a verified badge on their profile |
| Mobile App | Low | React Native app with shared Supabase backend |

---

## 9. User Flows

### 🛒 Buying Art
```
Explore Page → View Artwork Detail → Click "Buy Now"
→ Razorpay Checkout (via Supabase Edge Function — planned)
→ Order Created → Artwork status → SOLD
```

### ⚡ Bidding — Customer
```
/bid Page → See ACTIVE + UPCOMING auctions
→ Open Bid Detail → Enter amount ≥ currentHighest + minIncrement
→ POST /bids/:id/place → Become current winner
→ Outbid notification (planned — Supabase Realtime)
```

### ⚡ Bidding — Artist
```
Artist Dashboard or /bid Page → Click "+ Start a Bid"
→ Select artwork from dropdown → Set starting price, min increment
→ Pick start/end datetime
→ Bid created with UPCOMING status → Auto-transitions to ACTIVE at startsAt
```

### 🎨 Selling Art
```
Signup as ARTIST → Add Artwork (title, price, images, category)
→ Status = PENDING_REVIEW → Admin reviews
→ Approved → Status = LISTED → Visible in Marketplace
```

### 🔍 KYC Verification
```
Customer Dashboard → KYC banner → /profile?tab=kyc
→ Upload PAN + Aadhaar → Status = PENDING
→ Admin reviews → Status = VERIFIED / FAILED
→ VERIFIED: unlock bidding and wallet features
```

### 🎫 Support
```
Customer → Create ticket (subject, description, linked order)
→ Support Dashboard → Agent sees OPEN ticket
→ "Assign to Me" → "Start Working" (IN_PROGRESS) → "Mark Resolved"
```

### 👑 Admin
```
Login → Dashboard loads from Supabase queries
→ See KPIs: users, revenue, orders, active bids, pending KYC, open tickets
→ Alert banners for urgent items
→ Click through to KYC Review / Order Management / User Management
```

---

## 10. Role-Based Dashboards

All dashboards share a sidebar layout (`/dashboard/layout.tsx`) with role-specific nav items and a role-switcher for multi-role users.

### 🎨 Artist Studio (`/dashboard/artist`)

| Section | Content |
|---------|---------|
| KPI Cards | Total Artworks · Pending Orders · Total Earnings · Active Bids |
| Actions | Add Artwork · Start Bid · Manage Artworks · Wallet · Bid Requests |
| Column 1 | Recent Artworks (status badges + Edit/View links) |
| Column 2 | My Active Bids (current price, participant count, status) |
| Bottom | Recent Sales — order table with status, date, amount |

### 🛒 Customer Dashboard (`/dashboard/customer`)

| Section | Content |
|---------|---------|
| KYC Alert | Warning/error banner when KYC is not VERIFIED |
| KPI Cards | Active Orders · Wishlist Items · Wallet Balance · Total Spent |
| Actions | Explore Art · Live Bids · Wishlist · Charcha |
| Column 1 | Live Bids Feed (ACTIVE + UPCOMING from `/bids/active`) |
| Column 2 | Quick Access grid (Orders, Wallet, Kalent, Support) |
| Bottom | Recent Orders — order table |

### 👑 Admin Console (`/dashboard/admin`)

| Section | Content |
|---------|---------|
| Alerts | KYC pending count banner · Open tickets count banner |
| KPI Cards | Total Users · Total Artworks · Total Revenue · Total Orders · Open Tickets · Active Bids |
| Column 1 | Users by Role — breakdown list from Supabase stats query |
| Column 2 | Admin Actions — Create User, User Management, KYC Review, Escrow |
| Bottom | Recent 10 Orders — with buyer name, artwork, status, amount |

### 📊 Manager Dashboard (`/dashboard/manager`)

| Section | Content |
|---------|---------|
| Alerts | Pending KYC review banner · Open tickets banner |
| KPI Cards | Total Orders · Revenue · Artworks · Active Bids · Pending KYC · Total Users |
| Quick Actions | KYC Review (with live count) · Support Tickets · All Orders · Bid Requests |
| Bottom | Recent 10 Orders |

### 🎫 Support Center (`/dashboard/support`)

| Section | Content |
|---------|---------|
| Urgent Alert | Banner when HIGH/URGENT priority tickets are open |
| KPI Cards | Open · In Progress · Resolved · My Tickets |
| Filter Tabs | OPEN / IN_PROGRESS / RESOLVED / ALL |
| Ticket Cards | Subject, reporter, date, order link, assignee, priority badge, status badge |
| Per-ticket Actions | Assign to Me · Start Working · Mark Resolved · Reopen |

---
## 11. Database Design

**Database:** PostgreSQL hosted on **Supabase** — table names use PascalCase (matching the Prisma schema).

### Key Models

```
User            — Core identity; holds role + roles[], links to Wallet, Artist
Artist          — Extended profile for ARTIST users (bio, specialty, region, rating)
Artwork         — Listing with status workflow, price, images, category
Bid             — Auction record (startingPrice, minIncrement, startsAt, endsAt, status)
BidParticipant  — Join table User ↔ Bid (amount, isWinning flag)
BidRequest      — Custom artwork commission requests from customers
Order           — Purchase record linking Buyer → Artwork
Payment         — Payment transaction record
Wallet          — balance + holdBalance per User
KYC             — PAN + Aadhaar verification document per User
SupportTicket   — Subject, description, priority, status, assigned agent
Delivery        — Shipment tracking linked to Order
Event           — Kalent event (COMPETITION, WORKSHOP, EXHIBITION)
Discussion      — Charcha forum topic
DiscussionReply — Replies to forum topics
```

### Relationships

```
User 1──1 Artist          (optional — only if ARTIST role)
User 1──1 Wallet          (every user gets a wallet on signup)
User 1──1 KYC             (one KYC document set per user)
Artist 1──* Artwork       (artist has many artworks)
Artwork 1──* Bid          (artwork can have multiple auctions over time)
Bid 1──* BidParticipant   (many users participate in each bid)
User 1──* Order           (as buyer)
User 1──* SupportTicket
Order 1──1 Delivery
User *──* Event           (via EventRegistration join table)
Discussion 1──* DiscussionReply
```

> The full schema is in `server/prisma/schema.prisma`. Use it as the source of truth when writing Supabase queries.

---

## 12. Design System

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--saffron` | `#E8722A` | Primary CTA buttons, stat card accents |
| `--royal-purple` | `#6B21A8` | Secondary actions, dashboard badges |
| `--teal` | `#0F766E` | Success states, verified badges |
| `--teal-light` | `#14B8A6` | Hover states |
| `--gold` | `#D97706` | Earnings, financial highlights |
| `--red` | `#DC2626` | Errors, urgent alerts |

### Global CSS Classes (`globals.css`)

```css
/* Buttons */
.btn  .btn-primary  .btn-secondary  .btn-ghost  .btn-sm  .btn-lg

/* Badges */
.badge  .badge-saffron  .badge-purple  .badge-teal  .badge-live  .badge-red

/* Cards & Layout */
.card  .stat-card  .stat-value  .stat-label
.section-title  .empty-state  .grid-art  .hscroll

/* Forms */
.input-field  .input-group
```

### Dashboard CSS Module Classes (`page.module.css`)

```css
/* KPI Grid */
.statsGrid         — responsive 4-column grid of stat cards
.statCard          — base stat card with top border accent
.statCardSaffron / .statCardPurple / .statCardTeal / .statCardGold / .statCardRed

/* Layout */
.header            — page header with title + action button
.twoCol            — two-column responsive split layout
.section           — padded card section
.sectionHeader     — section title with optional "view all" link
.actionsRow        — horizontal quick action buttons
.listStack         — stacked list of items

/* Alerts */
.alertBanner  .alertWarn  .alertError  .alertInfo

/* Orders Table */
.orderTable  .orderHeader  .orderRow  .orderId  .orderDate  .orderAmount
```

---

## 13. How to Run

### Prerequisites

- **Node.js** v18 or higher
- **Supabase project** — free tier works fine: [supabase.com](https://supabase.com)

---

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon public key** from **Project Settings → API**
3. Apply the database schema using the Prisma schema in `server/prisma/schema.prisma`:
   - Option A: Use `npx prisma db push` inside the `server/` folder with `DATABASE_URL` pointing to your Supabase Postgres connection string
   - Option B: Manually create tables via the Supabase SQL editor based on the schema

---

### Step 2 — Frontend Setup

```bash
cd client
npm install
cp env.example .env.local
```

Fill in `client/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> Both values are safe to expose in the browser. They give access only to what your Row-Level Security (RLS) policies permit.

---

### Step 3 — Run Locally

```bash
# Development server with hot reload
npm run dev
# → http://localhost:3000

# Production build (verify before deploying)
npm run build
npm start
```

---

### Step 4 — Deploy to Vercel

```bash
# From the client/ directory, or connect your GitHub repo in Vercel dashboard
vercel deploy
```

In Vercel → **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

> The build outputs 26 routes: 20 static + 6 dynamic. Zero TypeScript errors. ✓

---

### Quick Role Testing

Register test accounts at `/signup`:

| Role | Signup Option | Dashboard URL |
|------|--------------|---------------|
| Customer | `CUSTOMER` | `/dashboard/customer` |
| Artist | `ARTIST` | `/dashboard/artist` |
| Admin | Create directly in Supabase Auth + set `role = 'ADMIN'` in the `User` table | `/dashboard/admin` |

---

*Last updated: April 2026*
