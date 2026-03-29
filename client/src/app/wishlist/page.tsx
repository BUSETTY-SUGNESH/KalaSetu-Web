import ArtCard from '@/components/cards/ArtCard';
import { mockArtworks } from '@/lib/mockData';

export default function WishlistPage() {
  const wishlistedArt = mockArtworks.slice(0, 4);
  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Wishlist</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>{wishlistedArt.length} items saved</p>
      <div className="grid-art">
        {wishlistedArt.map(art => <ArtCard key={art.id} art={art} />)}
      </div>
    </div>
  );
}
