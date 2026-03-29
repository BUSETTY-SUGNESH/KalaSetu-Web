import { Artwork, Artist, Bid, KalentEvent, Discussion } from '@/types';

export const mockArtworks: Artwork[] = [
  { id: '1', artistId: 'a1', artistName: 'Priya Sharma', artistAvatar: '', title: 'Ethereal Dawn', description: 'A mesmerizing watercolor capturing the golden hour over Varanasi ghats', price: 24500, category: 'Painting', medium: 'Watercolor', dimensions: { width: 24, height: 36, unit: 'inches' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 342, createdAt: '2026-03-15' },
  { id: '2', artistId: 'a2', artistName: 'Ravi Kumar', artistAvatar: '', title: 'Kathak in Motion', description: 'Bronze sculpture capturing the grace of Kathak dance', price: 85000, category: 'Sculpture', medium: 'Bronze', dimensions: { width: 12, height: 18, unit: 'inches' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 518, createdAt: '2026-03-10' },
  { id: '3', artistId: 'a3', artistName: 'Ananya Patel', artistAvatar: '', title: 'Digital Mandala', description: 'Intricate digital mandala blending traditional patterns with modern aesthetics', price: 12000, category: 'Digital Art', medium: 'Digital', dimensions: { width: 4000, height: 4000, unit: 'px' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 892, createdAt: '2026-03-12' },
  { id: '4', artistId: 'a1', artistName: 'Priya Sharma', artistAvatar: '', title: 'Monsoon Rhapsody', description: 'Oil painting depicting the dramatic monsoon skies of Kerala', price: 45000, category: 'Painting', medium: 'Oil on Canvas', dimensions: { width: 36, height: 48, unit: 'inches' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 267, createdAt: '2026-03-08' },
  { id: '5', artistId: 'a4', artistName: 'Vikram Singh', artistAvatar: '', title: 'Peacock Silk Weave', description: 'Hand-woven silk textile with intricate peacock motifs', price: 35000, category: 'Textile', medium: 'Silk', dimensions: { width: 48, height: 72, unit: 'inches' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 179, createdAt: '2026-03-05' },
  { id: '6', artistId: 'a5', artistName: 'Meera Nair', artistAvatar: '', title: 'Temple Bells', description: 'Mixed media capturing the spiritual essence of South Indian temples', price: 28000, category: 'Mixed Media', medium: 'Mixed Media', dimensions: { width: 24, height: 24, unit: 'inches' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 441, createdAt: '2026-03-01' },
  { id: '7', artistId: 'a3', artistName: 'Ananya Patel', artistAvatar: '', title: 'Neon Ganesha', description: 'Contemporary digital interpretation of Lord Ganesha in neon aesthetics', price: 8500, category: 'Digital Art', medium: 'Digital', dimensions: { width: 3000, height: 4000, unit: 'px' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 1203, createdAt: '2026-02-28' },
  { id: '8', artistId: 'a2', artistName: 'Ravi Kumar', artistAvatar: '', title: 'The Potter', description: 'Terracotta figurine celebrating traditional Indian pottery artisans', price: 18000, category: 'Sculpture', medium: 'Terracotta', dimensions: { width: 8, height: 14, unit: 'inches' }, images: ['/placeholder-art.jpg'], status: 'LISTED', viewCount: 312, createdAt: '2026-02-25' },
];

export const mockArtists: Artist[] = [
  { id: 'a1', userId: 'u1', name: 'Priya Sharma', bio: 'Watercolor & oil painter from Varanasi, specializing in landscapes and spiritual art', specialty: 'Paintings', region: 'Uttar Pradesh', rating: 4.8, totalSales: 47, verificationStatus: 'APPROVED' },
  { id: 'a2', userId: 'u2', name: 'Ravi Kumar', bio: 'Master sculptor working with bronze and terracotta, bringing Indian mythology to life', specialty: 'Sculpture', region: 'Tamil Nadu', rating: 4.9, totalSales: 32, verificationStatus: 'APPROVED' },
  { id: 'a3', userId: 'u3', name: 'Ananya Patel', bio: 'Digital artist blending traditional Indian motifs with contemporary design', specialty: 'Digital Art', region: 'Gujarat', rating: 4.7, totalSales: 89, verificationStatus: 'APPROVED' },
  { id: 'a4', userId: 'u4', name: 'Vikram Singh', bio: 'Traditional textile artist preserving the art of hand-loom weaving', specialty: 'Textile', region: 'Rajasthan', rating: 4.6, totalSales: 23, verificationStatus: 'APPROVED' },
  { id: 'a5', userId: 'u5', name: 'Meera Nair', bio: 'Mixed media artist exploring the intersection of tradition and modernity', specialty: 'Mixed Media', region: 'Kerala', rating: 4.8, totalSales: 38, verificationStatus: 'APPROVED' },
  { id: 'a6', userId: 'u6', name: 'Arjun Desai', bio: 'Photographer and visual artist documenting rural India through his lens', specialty: 'Photography', region: 'Maharashtra', rating: 4.5, totalSales: 56, verificationStatus: 'APPROVED' },
];

export const mockBids: Bid[] = [
  { id: 'b1', artworkId: '1', artwork: mockArtworks[0], artistId: 'a1', artistName: 'Priya Sharma', startingPrice: 20000, minIncrement: 500, currentHighest: 32500, currentWinnerName: 'Amit K.', startsAt: '2026-03-28T10:00:00', endsAt: '2026-03-30T18:00:00', status: 'ACTIVE', participantCount: 12 },
  { id: 'b2', artworkId: '2', artwork: mockArtworks[1], artistId: 'a2', artistName: 'Ravi Kumar', startingPrice: 70000, minIncrement: 2000, currentHighest: 98000, currentWinnerName: 'Sneha R.', startsAt: '2026-03-27T12:00:00', endsAt: '2026-03-31T20:00:00', status: 'ACTIVE', participantCount: 8 },
  { id: 'b3', artworkId: '4', artwork: mockArtworks[3], artistId: 'a1', artistName: 'Priya Sharma', startingPrice: 40000, minIncrement: 1000, currentHighest: 40000, startsAt: '2026-04-01T10:00:00', endsAt: '2026-04-05T18:00:00', status: 'UPCOMING', participantCount: 0 },
];

export const mockEvents: KalentEvent[] = [
  { id: 'e1', title: 'National Digital Art Competition', description: 'Showcase your digital artistry. Open to all Indian digital artists. Cash prizes worth ₹5 Lakh.', type: 'COMPETITION', fee: 500, location: 'Online', isVirtual: true, maxParticipants: 500, status: 'upcoming', startsAt: '2026-04-15T09:00:00', endsAt: '2026-04-20T18:00:00', registeredCount: 234 },
  { id: 'e2', title: 'Madhubani Painting Workshop', description: 'Learn the ancient art of Madhubani painting from master artisans of Bihar.', type: 'WORKSHOP', fee: 1200, location: 'Jaipur Art Center', isVirtual: false, maxParticipants: 30, status: 'upcoming', startsAt: '2026-04-10T10:00:00', endsAt: '2026-04-10T16:00:00', registeredCount: 22 },
  { id: 'e3', title: 'Colors of India Exhibition', description: 'A curated exhibition featuring works from 50+ emerging Indian artists.', type: 'EXHIBITION', fee: 0, location: 'National Gallery, Delhi', isVirtual: false, maxParticipants: 1000, status: 'upcoming', startsAt: '2026-04-25T10:00:00', endsAt: '2026-04-30T20:00:00', registeredCount: 567 },
  { id: 'e4', title: 'Calligraphy Masterclass', description: 'Master the art of Urdu and Hindi calligraphy with renowned calligrapher Ustad Nasir.', type: 'WORKSHOP', fee: 800, location: 'Online', isVirtual: true, maxParticipants: 50, status: 'upcoming', startsAt: '2026-04-05T14:00:00', endsAt: '2026-04-05T17:00:00', registeredCount: 41 },
];

export const mockDiscussions: Discussion[] = [
  { id: 'd1', authorId: 'u1', authorName: 'Priya Sharma', title: 'Tips for preserving watercolor paintings', body: 'What are the best ways to preserve watercolor art? I have been experimenting with UV-protective glass...', tags: ['technique', 'watercolor', 'preservation'], upvotes: 42, replyCount: 15, isPinned: true, createdAt: '2026-03-28' },
  { id: 'd2', authorId: 'u3', authorName: 'Ananya Patel', title: 'Is AI art a threat to traditional artists?', body: 'Wanted to start a healthy discussion about AI generated art and its impact on our community...', tags: ['discussion', 'ai', 'industry'], upvotes: 89, replyCount: 47, isPinned: false, createdAt: '2026-03-27' },
  { id: 'd3', authorId: 'u2', authorName: 'Ravi Kumar', title: 'Best clay sources in South India', body: 'Fellow sculptors, where do you source your clay? Looking for high-quality terracotta clay...', tags: ['sculpture', 'materials', 'sourcing'], upvotes: 23, replyCount: 8, isPinned: false, createdAt: '2026-03-26' },
  { id: 'd4', authorId: 'u4', authorName: 'Vikram Singh', title: 'Revival of Bandhani: A personal journey', body: 'Sharing my experience of reviving the Bandhani tie-dye technique in my village...', tags: ['textile', 'heritage', 'story'], upvotes: 67, replyCount: 21, isPinned: false, createdAt: '2026-03-25' },
];

export const categories = [
  { name: 'Paintings', icon: '🎨', count: 1240 },
  { name: 'Sculpture', icon: '🗿', count: 456 },
  { name: 'Digital Art', icon: '💻', count: 892 },
  { name: 'Textile', icon: '🧵', count: 334 },
  { name: 'Photography', icon: '📸', count: 678 },
  { name: 'Mixed Media', icon: '🎭', count: 245 },
  { name: 'Pottery', icon: '🏺', count: 189 },
  { name: 'Calligraphy', icon: '✒️', count: 312 },
];

export const testimonials = [
  { name: 'Arun Mehta', role: 'Art Collector', text: 'KalaSetu has completely transformed how I discover and collect Indian art. The quality of artists here is exceptional.', rating: 5 },
  { name: 'Deepa Krishnan', role: 'Interior Designer', text: 'I source all my client projects through KalaSetu. The bidding system helps me get unique pieces at fair prices.', rating: 5 },
  { name: 'Suresh Babu', role: 'Artist', text: 'As a traditional artist from a small town, KalaSetu gave me a platform to reach art lovers across the country.', rating: 5 },
];
