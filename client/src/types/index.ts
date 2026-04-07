export type UserRole = 'CUSTOMER' | 'ARTIST' | 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'DELIVERY';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  roles: UserRole[];
  avatarUrl?: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  wallet?: {
    id: string;
    balance: number;
    holdBalance: number;
    updatedAt: string;
  } | null;
  kyc?: {
    status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
    panVerified: boolean;
    aadhaarVerified: boolean;
  } | null;
}

export interface Artist {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  specialty?: string;
  region?: string;
  avatarUrl?: string;
  rating: number;
  totalSales: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  artworks?: Artwork[];
}

export interface Artwork {
  id: string;
  artistId: string;
  artist?: {
    user: {
      name: string;
      avatarUrl?: string;
    }
  };
  title: string;
  description?: string;
  price: number;
  category: string;
  medium?: string;
  dimensions?: { width: number; height: number; unit: string };
  images: string[];
  status: 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'SOLD' | 'REMOVED';
  viewCount: number;
  createdAt: string;
}

export interface Bid {
  id: string;
  artworkId: string;
  artwork: Artwork;
  artistId: string;
  artistName?: string;
  artist?: {
    user: {
      name: string;
    }
  };
  startingPrice: number;
  minIncrement: number;
  currentHighest: number;
  currentWinnerName?: string;
  currentWinnerId?: string;
  startsAt: string;
  endsAt: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  participantCount: number;
  participants?: Array<{
    id: string;
    amount: number;
    placedAt: string;
    user: {
      id: string;
      name: string;
    };
    isWinning: boolean;
  }>;
}

export interface KalentEvent {
  id: string;
  title: string;
  description?: string;
  type: 'COMPETITION' | 'WORKSHOP' | 'EXHIBITION';
  fee: number;
  location?: string;
  isVirtual: boolean;
  maxParticipants?: number;
  status: string;
  startsAt: string;
  endsAt: string;
  imageUrl?: string;
  registeredCount: number;
}

export interface Discussion {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  artwork: Artwork;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  trackingNumber?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'bid' | 'event' | 'system' | 'message';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ─── BID REQUEST SYSTEM ────────────────────────────────

export interface BidRequest {
  id: string;
  customerId: string;
  customer?: { id: string; name: string; avatarUrl?: string };
  title: string;
  description: string;
  category?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
  status: 'OPEN' | 'BIDDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  artistBids?: ArtistBid[];
  _count?: { artistBids: number };
  createdAt: string;
}

export interface ArtistBid {
  id: string;
  bidRequestId: string;
  artistId: string;
  artist?: {
    id: string;
    rating: number;
    totalSales: number;
    user: { name: string; avatarUrl?: string };
  };
  amount: number;
  proposal: string;
  estimatedDays?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
}

export interface BidAnalytics {
  count: number;
  highest: number;
  lowest: number;
  average: number;
  history: { amount: number; timestamp: string }[];
}

// ─── WALLET & ESCROW ───────────────────────────────────

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REFUND';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface EscrowTransaction {
  id: string;
  walletId: string;
  orderId?: string;
  bidRequestId?: string;
  amount: number;
  status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  heldAt: string;
  releasedAt?: string;
  refundedAt?: string;
}

// ─── KYC ───────────────────────────────────────────────

export interface KycInfo {
  id?: string;
  status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  panNumber?: string;
  panVerified: boolean;
  aadhaarNumber?: string;
  aadhaarVerified: boolean;
  rejectionReason?: string;
}

// ─── SUPPORT ───────────────────────────────────────────

export interface SupportTicket {
  id: string;
  userId: string;
  orderId?: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  assignee?: { id: string; name: string };
  order?: { id: string; status: string; totalAmount: number };
  resolvedAt?: string;
  createdAt: string;
}

// ─── DELIVERY ──────────────────────────────────────────

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryUserId: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  notes?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  order?: {
    id: string;
    totalAmount: number;
    shippingAddress: Record<string, string>;
    status: string;
    artwork?: { title: string };
    buyer?: { name: string; phone?: string };
  };
}

// ─── ORDER EVENT ───────────────────────────────────────

export interface OrderEvent {
  id: string;
  orderId: string;
  status: string;
  note?: string;
  createdBy?: string;
  user?: { name: string };
  createdAt: string;
}
