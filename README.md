# KalaSetu - India's Premier Cultural Marketplace

**KalaSetu** is a comprehensive web platform designed to bridge the gap between Indian artists and art enthusiasts. It serves as a vibrant marketplace for discovering, buying, and bidding on authentic Indian art, while also fostering a community through events and discussions.

## 🚀 Features

- **Explore Art**: Browse thousands of artworks across various categories (Paintings, Sculptures, Digital Art, etc.).
- **Live Bidding**: Participate in real-time auctions for unique art pieces.
- **Artist Profiles**: Discover verified Indian artists, view their portfolios, and learn their stories.
- **Kalent (Events)**: Join workshops, exhibitions, and cultural events.
- **Charcha Sabha (Discussions)**: Engage in conversations about Indian art and culture.
- **User Authentication**: Secure login and registration for artists and buyers.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: CSS Modules, CSS Variables
- **Backend**: Node.js, Express, Prisma (ORM)
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt

## 📂 Project Structure

```
KalaSetu-Web/
├── client/             # Next.js Frontend
│   ├── app/            # Pages and Layouts
│   ├── components/     # Reusable Components
│   ├── lib/            # Utilities and Mock Data
│   └── styles/         # Global and Component Styles
├── server/             # Express Backend
│   ├── routes/         # API Endpoints
│   ├── controllers/    # Business Logic
│   ├── middleware/     # Auth Middleware
│   └── prisma/         # Database Models
├── prisma/             # Prisma Schema (Root)
└── .env                # Environment Variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create database schema
npx prisma migrate dev --name init

# Start server
npm start
```

The API will be available at `http://localhost:5000`.

### 2. Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## 📝 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kalasetu"

# JWT
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1h"

# CORS
FRONTEND_URL="http://localhost:3000"
```

## 🎨 Mock Data

The frontend includes comprehensive mock data in `client/src/lib/mockData.ts` for development purposes. This includes:

- **Artworks**: Paintings, sculptures, digital art, etc.
- **Artists**: Verified Indian artists with bios and ratings.
- **Bids**: Active and upcoming auctions.
- **Events**: Workshops and exhibitions.
- **Discussions**: Community forum topics.

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

