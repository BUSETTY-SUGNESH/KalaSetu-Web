export interface User {
  id: string;
  name: string;
  email: string;
  role: 'GUEST' | 'CUSTOMER' | 'VERIFIED_CUSTOMER' | 'ARTIST' | 'ADMIN' | 'OPS' | 'MANAGER';
  avatarUrl?: string;
  isVerified: boolean;
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
  artistName: string;
  artistAvatar?: string;
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
  artistName: string;
  startingPrice: number;
  minIncrement: number;
  currentHighest: number;
  currentWinnerName?: string;
  startsAt: string;
  endsAt: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  participantCount: number;
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
