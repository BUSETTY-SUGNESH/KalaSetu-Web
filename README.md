# 🎨 KalaSetu - India's Premier Cultural Marketplace

**KalaSetu** (The Bridge of Art) is a production-grade digital ecosystem designed to connect Indian artisans with global art enthusiasts. It is more than just a marketplace; it is a community-driven platform for discovering authentic art, participating in live auctions, attending cultural workshops, and engaging in intellectual discussions about India's heritage.

---

## 🏛️ 1. PROJECT OVERVIEW
KalaSetu addresses the fragmentation in the Indian art market by providing:
*   **Art Marketplace**: A curated space for buying paintings, sculptures, textiles, and digital art.
*   **Live Bidding**: A real-time auction system for exclusive and rare masterpieces.
*   **Community (Charcha Sabha)**: A forum for artists and collectors to discuss techniques, history, and trends.
*   **Events (Kalent)**: A hub for cultural workshops, exhibitions, and national-level art competitions.

---

## 🏗️ 2. SYSTEM ARCHITECTURE
The project follows a modern decoupled architecture:

*   **Frontend (Next.js)**: Built with Next.js 14+ App Router, providing a fast, SEO-friendly interface. Uses React Context for state management and Axios for secure API communication.
*   **Backend (Node.js + Express)**: A modular TypeScript-based RESTful API. It handles business logic, authentication, and database orchestration.
*   **Database (PostgreSQL + Prisma)**: A relational database chosen for data integrity. Prisma ORM provides type-safe queries and simplified schema migrations.
*   **Real-time (WebSockets)**: Planned integration via Socket.io for live bid updates and instant notifications.

**Interaction Flow**: 
1. Client requests are authenticated via JWT (stored in local storage) and Refresh Tokens (stored in HTTP-only cookies).
2. The Express server validates requests using Zod schemas before querying the PostgreSQL database via Prisma.
3. Real-time updates (like new bids) are pushed to the client to maintain state sync without manual refreshes.

---

## ✅ 3. WHAT IS COMPLETED
### Backend
*   **Modular Architecture**: Clean separation of concerns (routes, controllers, services).
*   **Auth System**: Full JWT implementation with Access/Refresh token rotation.
*   **RBAC**: Role-Based Access Control (Guest, Customer, Artist, Admin).
*   **Artwork CRUD**: Complete API for listing, updating, and fetching artworks.
*   **User/Artist Management**: Profile management and artist verification workflows.

### Frontend
*   **Auth Flow**: Integrated Login/Signup with persistent session management.
*   **Explore Module**: Advanced filtering by category and real-time search.
*   **Art Detail**: Dynamic pages for every masterpiece with deep-linking.
*   **Dashboard**: Personal user hub showing quick actions and recent orders.

### Database
*   **Production Schema**: 15+ relational models covering the entire ecosystem.
*   **Prisma Client**: Fully generated and integrated into the backend.

---

## ⚠️ 4. WHAT IS PARTIALLY DONE
*   **Bidding System**: The backend logic for placing bids and validating increments is implemented. However, the frontend is currently using mock data and needs to be switched to the active bid APIs.
*   **Order Flow**: Basic order creation is functional. The full checkout experience (shipping address validation and order tracking) is pending.
*   **Wallet Logic**: The schema for balances and transactions is ready, but the logic for automatic credit/debit on purchase is in progress.

---

## ❌ 5. WHAT IS NOT BUILT YET
*   **Payments Integration**: Placeholders for Razorpay/Stripe exist in the `.env`, but the gateway logic is not yet integrated.
*   **Real-time Notifications**: A centralized system to notify users about bid outbids or event reminders.
*   **Charcha & Kalent Modules**: The community forum and event registration modules are currently frontend-only mockups.
*   **Performance Optimizations**: Redis caching for trending artworks and Image optimization (Cloudinary/S3) for artist portfolios.

---

## � 6. USER FLOWS
*   **Buying Art**: User discovers art on the **Explore** page → Views details → Clicks **Buy Now** → Order is generated and artwork status changes to `SOLD`.
*   **Bidding**: User visits **Live Bids** → Enters an amount higher than the `currentHighest` + `minIncrement` → Becomes the current winner.
*   **Selling**: Artist signs up → Uploads artwork via **Dashboard** → Artwork enters `PENDING_REVIEW` → Admin approves → Artwork appears in the **Marketplace**.
*   **Community**: Users participate in **Charcha Sabha** by creating topics or replying to existing threads to earn "Trust Scores".

---

## 📊 7. DATABASE DESIGN
The database uses **PostgreSQL** for its reliability with complex relations.
*   **Key Tables**: `User`, `Artist`, `Artwork`, `Bid`, `Order`, `Payment`, `Wallet`, `Event`, `Discussion`.
*   **Relationships**: 
    *   One-to-One: `User` ↔ `Artist`, `User` ↔ `Wallet`.
    *   One-to-Many: `Artist` → `Artworks`, `Artwork` → `Reviews`.
    *   Many-to-Many: `User` ↔ `Bids` (via `BidParticipant`), `User` ↔ `Events` (via `EventRegistration`).

---

## � 8. API STRUCTURE
Base URL: `http://localhost:5000/api`

*   `POST /auth/login` & `/auth/signup`: Session management.
*   `GET /artworks`: Fetch listed art with category filters.
*   `GET /artworks/:id`: Detailed artwork view.
*   `GET /users/profile`: Private user data (Auth required).
*   `POST /bids/:id/place`: Participate in auctions (Auth required).
*   `POST /orders`: Create a new purchase.

---

## 📂 9. PROJECT STRUCTURE
```
KalaSetu/
├── client/                 # Next.js Frontend
│   ├── src/app/            # App Router pages
│   ├── src/components/     # Reusable UI (Cards, Layout)
│   ├── src/context/        # Auth & State Providers
│   └── src/lib/            # Axios API client & Mock Data
├── server/                 # Express Backend
│   ├── src/modules/        # Feature-based folders (Auth, Art, Bids)
│   ├── src/middleware/     # Auth & Validation
│   ├── src/utils/          # JWT & Helper functions
│   └── prisma/             # Schema & Migrations
└── README.md               # This file
```

---

## ⚙️ 10. HOW TO RUN THE PROJECT
### Prerequisites
*   Node.js (v18+)
*   PostgreSQL instance

### Step 1: Backend Setup
1.  Navigate to `/server`.
2.  `npm install`
3.  Configure `.env` (DATABASE_URL, JWT_SECRET).
4.  `npx prisma migrate dev`
5.  `npm run dev`

### Step 2: Frontend Setup
1.  Navigate to `/client`.
2.  `npm install`
3.  `npm run dev`

---

## 📈 11. CURRENT STATUS DASHBOARD
| Feature | Status | Notes |
| :--- | :--- | :--- |
| **User Auth** | ✅ Completed | JWT, Refresh Tokens, RBAC |
| **Art Marketplace** | ✅ Completed | CRUD, Filtering, Detail views |
| **Order System** | ⚠️ Partial | Creation works, Checkout pending |
| **Bidding** | ⚠️ Partial | Backend ready, Frontend sync pending |
| **Payments** | ❌ Not Built | Razorpay/Stripe skeleton only |
| **Community** | ❌ Not Built | Mockups only |

---

## 🗺️ 12. FUTURE ROADMAP
*   **Phase 1**: Stabilize Order & Payment flow (E-commerce core).
*   **Phase 2**: Full WebSocket integration for Auctions.
*   **Phase 3**: Launch Charcha Sabha (Community) and Artist Verification levels.
*   **Phase 4**: Mobile App (React Native) and AI-based art recommendations.

---

## 🤝 13. COLLABORATION NOTE
This project is built using an **AI-assisted iterative development** model.
*   **Architecture First**: The codebase follows a strict modular structure to ensure scalability.
*   **Consistency**: Contributors must follow existing naming conventions and use Zod for all input validations.
*   **Documentation**: Every major architectural change must be reflected in this README.
