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
11. [API Reference](#11-api-reference)
12. [Database Design](#12-database-design)
13. [Design System](#13-design-system)
14. [How to Run](#14-how-to-run)

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

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 16.x | App Router, SSR, dynamic routing |
| TypeScript | 5.x | Type safety across the codebase |
| CSS Modules + Global CSS | — | Scoped styles with a shared dark-theme design system |
| Axios | — | HTTP client with JWT interceptors and auto token refresh |
| React Context | — | Auth state, role switching, session persistence |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js + Express | 18.x | RESTful API server |
| TypeScript | 5.x | Strict types for controllers, schemas, and models |
| Prisma ORM | — | Type-safe database queries and schema migrations |
| PostgreSQL | — | Primary relational database |
| Zod | — | Request body validation with coercion support |
| JWT + bcryptjs | — | Authentication and password hashing |
| Razorpay | — | Payment gateway for purchases and wallet top-ups |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js 16)                       │
│  App Router  │  CSS Modules  │  Axios  │  React Context      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT Bearer
┌──────────────────────────▼──────────────────────────────────┐
│                   SERVER (Express + TS)                      │
│  Zod Validation  │  RBAC Middleware  │  Modular Controllers  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│  15+ relational models  │  Cascading relations  │  Prisma    │
└─────────────────────────────────────────────────────────────┘
```

**Auth Flow:**
1. Client sends credentials → server issues short-lived **Access Token** (localStorage) + long-lived **Refresh Token** (HTTP-only cookie).
2. Axios interceptor silently refreshes the access token on 401 responses.
3. Every protected route passes through `authenticate` middleware (JWT verify) and `authorize` middleware (role check).

---

## 4. Project Structure

```
KalaSetu-Web/
│
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx       # Shared sidebar layout
│   │   │   │   ├── page.module.css  # Shared dashboard styles (KPI cards, tables, alerts)
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
│   │   │   └── signup/              # Auth — Register (all roles)
│   │   ├── components/
│   │   │   ├── cards/               # ArtCard, ArtistCard, BidCard, EventCard, DiscussionCard
│   │   │   └── layout/              # Navbar, Footer, BottomNav
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Session, user state, role switching
│   │   ├── hooks/
│   │   │   ├── useRequireAuth.ts    # Redirect if unauthenticated
│   │   │   └── useRequireRole.ts    # Redirect if wrong role
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance with JWT interceptors
│   │   │   ├── authToken.ts         # Token storage helpers
│   │   │   └── payment.ts           # Razorpay checkout helper
│   │   └── types/
│   │       └── index.ts             # Shared TypeScript types
│   ├── public/                      # Static assets
│   ├── env.example                  # Env template
│   └── package.json
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── index.ts                 # App entry — registers all routes
│   │   ├── config/
│   │   │   ├── db.ts                # Prisma client singleton
│   │   │   └── env.ts               # Env validation (fails fast on boot)
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts   # authenticate + authorize(roles[])
│   │   ├── modules/
│   │   │   ├── auth/                # signup, login, refresh, switch-role
│   │   │   ├── artworks/            # CRUD, mine, status management
│   │   │   ├── bids/                # create (ARTIST), active, place
│   │   │   ├── bid-requests/        # open, create, accept, complete
│   │   │   ├── orders/              # create, my, status updates, timeline
│   │   │   ├── payments/            # Razorpay create-order, verify, history
│   │   │   ├── wallet/              # balance, transactions
│   │   │   ├── users/               # profile, artists, dashboard-stats
│   │   │   ├── kyc/                 # submit, verify, status
│   │   │   ├── support/             # create ticket, all, assign, status
│   │   │   ├── delivery/            # my deliveries, status updates
│   │   │   ├── events/              # Kalent events
│   │   │   └── discussions/         # Charcha forum
│   │   └── utils/
│   │       ├── jwt.ts               # Token generation & verification
│   │       ├── http.ts              # sendSuccess / sendError helpers
│   │       └── logger.ts            # Structured error logging
│   ├── prisma/
│   │   └── schema.prisma            # Full DB schema (15+ models)
│   ├── env.example
│   └── package.json
│
└── README.md                        # This file
```

---

## 5. User Roles

| Role | Access Level | Primary Purpose |
|------|-------------|-----------------|
| `BUYER` / `CUSTOMER` | Standard | Browse, buy, bid, wishlist, support tickets |
| `ARTIST` | Standard | All of BUYER + list artworks, create bids, view earnings |
| `DELIVERY` | Operational | Accept and progress delivery assignments |
| `SUPPORT` | Staff | View all support tickets, assign, resolve |
| `MANAGER` | Staff | KYC review, platform analytics, order oversight |
| `ADMIN` | Super | Full platform control — create users, escrow, all management |

> **Multi-role**: Users can hold multiple roles simultaneously. The active role is switchable via the dashboard sidebar.

---

## 6. Features — Completed

### 🔐 Authentication & Authorization
- JWT access tokens (15 min) + HTTP-only refresh token cookies (7 days)
- Silent token refresh via Axios interceptor on any 401 response
- Role-Based Access Control (RBAC) with `authenticate` + `authorize(roles[])` middleware
- Role switching for multi-role users via `POST /auth/switch-role`
- Signup supports all roles: `BUYER`, `ARTIST`, `ADMIN`, `MANAGER`, `SUPPORT`

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

### 📊 Dashboard Stats Endpoint
- `GET /users/dashboard-stats` (ADMIN/MANAGER only)
- Single API call returns: total users, total artworks, total orders, total revenue, active bids, open tickets, pending KYC, last 10 orders (with buyer + artwork name), and users grouped by role

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
| Order Checkout UX | 🔄 Partial | Order creation works; shipping address + tracking UI pending |
| Charcha (Discussion Forum) | 🔄 Partial | Backend APIs exist; frontend pages partially built |
| Kalent (Events) | 🔄 Partial | Event listing works; registration flow in progress |
| Delivery Dashboard | 🔄 Partial | Basic status progression; full workflow pending |
| Bid Requests | 🔄 Partial | Open requests + artist bidding works; full lifecycle incomplete |

---

## 8. Features — Planned

| Feature | Priority | Description |
|---------|----------|-------------|
| Real-time Notifications | High | Socket.io for outbid alerts, order updates, event reminders |
| Payment Webhooks | High | Razorpay webhooks for edge cases (closed browser, bank failure) |
| Image Optimization | Medium | Cloudinary/S3 for artist portfolio and artwork images |
| Redis Caching | Medium | Cache trending artworks and public explore queries |
| Admin Analytics Charts | Medium | Revenue trends, user growth, bid activity graphs |
| Artist Verification Badge | Low | Approved artists get a verified badge on their profile |
| Mobile App | Low | React Native app with shared API layer |

---

## 9. User Flows

### 🛒 Buying Art
```
Explore Page → View Artwork Detail → Click "Buy Now"
→ Razorpay Checkout → Verify Payment (server-side signature check)
→ Order Created → Artwork status → SOLD
```

### ⚡ Bidding — Customer
```
/bid Page → See ACTIVE + UPCOMING auctions
→ Open Bid Detail → Enter amount ≥ currentHighest + minIncrement
→ POST /bids/:id/place → Become current winner
→ Outbid notification when someone bids higher (planned)
```

### ⚡ Bidding — Artist
```
Artist Dashboard or /bid Page → Click "+ Start a Bid"
→ Select artwork from dropdown → Set starting price, min increment
→ Pick start/end datetime (min constraint = now)
→ POST /bids → Bid created with UPCOMING status
→ Auto-transitions to ACTIVE at startsAt
```

### 🎨 Selling Art
```
Signup as ARTIST → Add Artwork (title, price, images, category)
→ Status = PENDING_REVIEW → Admin/Manager reviews
→ Approved → Status = LISTED → Visible in Marketplace
```

### 🔍 KYC Verification
```
Customer Dashboard → KYC banner → /profile?tab=kyc
→ Upload PAN + Aadhaar → Status = PENDING
→ Manager/Admin reviews → Status = VERIFIED / FAILED
→ VERIFIED: unlock bidding and wallet features
```

### 🎫 Support
```
Customer → Create ticket (subject, description, linked order)
→ Support Dashboard → Agent sees OPEN ticket
→ "Assign to Me" → "Start Working" (IN_PROGRESS)
→ Resolve issue → "Mark Resolved" (or "Reopen" if needed)
```

### 👑 Admin / Manager
```
Login → Dashboard loads in one API call (/users/dashboard-stats)
→ See KPIs: users, revenue, orders, active bids, pending KYC, open tickets
→ Alert banners for urgent items (KYC queue, open tickets)
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
| Column 1 | Users by Role — breakdown list from stats endpoint |
| Column 2 | Admin Actions — Create User, User Management, KYC Review, Escrow |
| Bottom | Recent 10 Orders — with buyer name, artwork, status, amount |

> **Data Source**: All stats from a single `GET /users/dashboard-stats` call.

### 📊 Manager Dashboard (`/dashboard/manager`)

| Section | Content |
|---------|---------|
| Alerts | Pending KYC review banner · Open tickets banner |
| KPI Cards | Total Orders · Revenue · Artworks · Active Bids · Pending KYC · Total Users |
| Quick Actions | KYC Review (with live count) · Support Tickets · All Orders · Bid Requests |
| Bottom | Recent 10 Orders (same as Admin) |

> **Data Source**: Same `/users/dashboard-stats` endpoint as Admin.

### 🎫 Support Center (`/dashboard/support`)

| Section | Content |
|---------|---------|
| Urgent Alert | Banner when HIGH/URGENT priority tickets are open |
| KPI Cards | Open · In Progress · Resolved · My Tickets |
| Filter Tabs | OPEN / IN_PROGRESS / RESOLVED / ALL |
| Ticket Cards | Subject, reporter, date, order link, assignee, priority badge, status badge |
| Per-ticket Actions | Assign to Me · Start Working · Mark Resolved · Reopen |

---

## 11. API Reference

**Base URL:** `http://localhost:5000/api`  
**Auth header:** `Authorization: Bearer <accessToken>`

---

### 🔐 Auth — `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | None | Register. Body: `{ name, email, password, role }` |
| POST | `/auth/login` | None | Login. Returns `accessToken`, sets refresh cookie |
| POST | `/auth/refresh-token` | Cookie | Rotate access token using refresh cookie |
| POST | `/auth/switch-role` | Bearer | Switch active role. Body: `{ role }` |
| POST | `/auth/logout` | Bearer | Clear refresh cookie |

**Accepted signup roles:** `BUYER`, `ARTIST`, `ADMIN`, `MANAGER`, `SUPPORT`

---

### 🖼️ Artworks — `/artworks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/artworks` | None | Browse listed artworks. Supports `?category=` filter |
| GET | `/artworks/:id` | None | Single artwork detail |
| GET | `/artworks/mine` | ARTIST | Artist's own artworks |
| POST | `/artworks` | ARTIST | Create a new artwork listing |
| PUT | `/artworks/:id` | ARTIST | Update an artwork |
| DELETE | `/artworks/:id` | ARTIST | Remove an artwork |

---

### ⚡ Bids — `/bids`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bids/active` | None | Returns all ACTIVE + UPCOMING bids |
| POST | `/bids` | ARTIST | Create an auction. Body: `{ artworkId, startingPrice, minIncrement, startsAt, endsAt }` |
| GET | `/bids/:id` | None | Bid detail with participant list |
| POST | `/bids/:id/place` | Bearer | Place a bid. Body: `{ amount }` |

---

### 🎯 Bid Requests — `/bid-requests`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bid-requests/open` | Bearer | List open bid requests |
| POST | `/bid-requests` | BUYER | Create a custom artwork commission request |
| POST | `/bid-requests/:id/place` | ARTIST | Artist places a bid on a request |
| POST | `/bid-requests/:id/accept` | BUYER | Accept an artist's bid |
| POST | `/bid-requests/:id/complete` | Bearer | Mark as complete |
| POST | `/bid-requests/:id/cancel` | Bearer | Cancel a bid request |

---

### 📦 Orders — `/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Bearer | Create a purchase order |
| GET | `/orders/my` | Bearer | Current user's orders (role-filtered) |
| GET | `/orders/:id` | Bearer | Single order detail |
| PATCH | `/orders/:id/status` | MANAGER/ADMIN | Update order status |
| GET | `/orders/:id/timeline` | Bearer | Order status history |

---

### 💳 Payments — `/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-order` | Bearer | Create Razorpay order (purchase or wallet top-up) |
| POST | `/payments/verify` | Bearer | Verify Razorpay signature + update wallet/order |
| GET | `/payments/my` | Bearer | User's full payment history |

---

### 👤 Users — `/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | Bearer | Current user's full profile |
| PUT | `/users/profile` | Bearer | Update name, phone, avatar |
| GET | `/users/profile-overview` | Bearer | Summary card for profile page |
| GET | `/users/artists` | None | Public artist directory |
| GET | `/users/artists/:id` | None | Single artist public profile |
| GET | `/users/dashboard-stats` | ADMIN/MANAGER | Platform-wide KPI stats |

**dashboard-stats response:**
```json
{
  "totalUsers": 142,
  "totalArtworks": 89,
  "totalOrders": 34,
  "totalRevenue": 285000,
  "activeBids": 6,
  "openTickets": 3,
  "pendingKyc": 8,
  "recentOrders": [ { "id": "...", "artwork": { "title": "..." }, "buyer": { "name": "..." }, "status": "CONFIRMED", "amount": 12500 } ],
  "usersByRole": [ { "role": "CUSTOMER", "count": 120 }, { "role": "ARTIST", "count": 18 } ]
}
```

---

### 💰 Wallet — `/wallet`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wallet/balance` | Bearer | Current balance + hold balance |
| GET | `/wallet/transactions` | Bearer | Full transaction history |

---

### 🔍 KYC — `/kyc`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/kyc/status` | Bearer | Current KYC status + submitted fields |
| POST | `/kyc/submit` | Bearer | Submit PAN + Aadhaar documents |
| POST | `/kyc/verify` | ADMIN/MANAGER | Approve or reject a KYC application |

---

### 🎫 Support — `/support`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/support` | Bearer | Create a support ticket |
| GET | `/support/my` | Bearer | Customer's own tickets |
| GET | `/support/all` | SUPPORT/MANAGER/ADMIN | All tickets. Supports `?status=OPEN` filter |
| POST | `/support/:id/assign` | SUPPORT/MANAGER/ADMIN | Assign ticket to an agent |
| PATCH | `/support/:id/status` | SUPPORT/MANAGER/ADMIN | Update ticket status |

---

### 🚚 Delivery — `/delivery`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/delivery/my` | DELIVERY | Active and completed deliveries |
| PATCH | `/delivery/:id/status` | DELIVERY | Progress delivery status |

---

### 📅 Events (Kalent) — `/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/events` | None | List all Kalent events |
| GET | `/events/:id` | None | Event detail |
| POST | `/events/:id/register` | Bearer | Register for an event |

---

### 💬 Discussions (Charcha) — `/discussions`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/discussions` | None | List all discussion topics |
| GET | `/discussions/:id` | None | Topic + all replies |
| POST | `/discussions` | Bearer | Create a new discussion topic |
| POST | `/discussions/:id/reply` | Bearer | Reply to a topic |

---

## 12. Database Design

**Database:** PostgreSQL — **ORM:** Prisma

### Key Models

```
User            — Core identity, holds role + roles[], links to Wallet, KYC, Artist
Artist          — Extended profile for ARTIST users (bio, specialty, region, rating)
Artwork         — Listing with status workflow, price, images, category
Bid             — Auction record (startingPrice, minIncrement, startsAt, endsAt, status)
BidParticipant  — Join table User ↔ Bid (amount, isWinning flag)
BidRequest      — Custom artwork commission requests from buyers
Order           — Purchase record linking Buyer → Artwork
Payment         — Razorpay transaction record (razorpayOrderId, paymentId, signature)
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

---

## 13. Design System

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--saffron` | `#E8722A` | Primary CTA buttons, stat card accents |
| `--royal-purple` | `#6B21A8` | Secondary actions, dashboard badges |
| `--teal` | `#0F766E` | Success states, verified badges |
| `--teal-light` | `#14B8A6` | Hover states |
| `--gold` | `#D97706` | Earnings, financial highlights |
| `--red` | `#DC2626` | Errors, urgent alerts |

### Global CSS Classes (globals.css)

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

### Dashboard CSS Module Classes (page.module.css)

```css
/* KPI Grid */
.statsGrid         — responsive 4-column grid of stat cards
.statCard          — base stat card with top border accent
.statCardSaffron   — saffron/orange top border
.statCardPurple    — royal purple top border
.statCardTeal      — teal top border
.statCardGold      — gold/amber top border
.statCardRed       — red top border (urgent/error metrics)
.statIcon  .statValue  .statLabel

/* Layout */
.header            — page header with title + action button
.twoCol            — two-column responsive split layout
.section           — padded card section
.sectionHeader     — section title with optional "view all" link
.actionsRow        — horizontal quick action buttons
.listStack         — stacked list of items
.listItem          — single list item with metadata

/* Alerts */
.alertBanner       — base alert banner
.alertWarn         — yellow warning (KYC pending, low stock)
.alertError        — red alert (overdue tickets, payment failed)
.alertInfo         — blue info

/* Orders Table */
.orderTable  .orderHeader  .orderRow
.orderId  .orderDate  .orderAmount

/* Quick Cards (Manager) */
.quickGrid  .quickCard  .quickIcon  .quickLabel  .quickValue
```

---

## 14. How to Run

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** — local or hosted ([Supabase](https://supabase.com) free tier works great)
- **Razorpay** account → [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys

---

### Step 1 — Backend Setup

```bash
cd server
npm install
cp env.example .env
```

Fill in `server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kalasetu"
JWT_SECRET="your-strong-secret-min-32-chars"
JWT_REFRESH_SECRET="another-strong-refresh-secret-min-32-chars"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
PORT=5000
NODE_ENV=development
```

```bash
# Apply the database schema
npx prisma migrate dev
# OR for a quick schema sync without migration history:
npx prisma db push

# Start the development server
npm run dev
```

> The server validates all required env vars on boot and will fail fast with a clear error if anything is missing.

---

### Step 2 — Frontend Setup

```bash
cd client
npm install
cp env.example .env.local
```

Fill in `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> ⚠️ **Security**: Only `RAZORPAY_KEY_ID` (the public key) goes in the frontend env. **Never** put `RAZORPAY_KEY_SECRET` here.

```bash
npm run dev
# Frontend starts at http://localhost:3000
```

---

### Quick Role Testing

Use `/signup` to register accounts for any role and test all dashboards:

| Account Role | Signup Option | Dashboard URL |
|-------------|--------------|---------------|
| Artist | `ARTIST` | `/dashboard/artist` |
| Buyer / Customer | `BUYER` | `/dashboard/customer` |
| Admin | `ADMIN` | `/dashboard/admin` |
| Manager | `MANAGER` | `/dashboard/manager` |
| Support Agent | `SUPPORT` | `/dashboard/support` |

---

*Last updated: April 2026*

## 🤝 13. COLLABORATION NOTE
This project is built using an **AI-assisted iterative development** model.
*   **Architecture First**: The codebase follows a strict modular structure to ensure scalability.
*   **Consistency**: Contributors must follow existing naming conventions and use Zod for all input validations.
*   **Documentation**: Every major architectural change must be reflected in this README.
