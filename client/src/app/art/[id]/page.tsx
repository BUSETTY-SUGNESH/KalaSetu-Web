'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Artwork } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { startPayment } from '@/lib/payment';
import ArtCard from '@/components/cards/ArtCard';
import styles from './page.module.css';

interface ArtworkReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { name?: string; avatarUrl?: string };
}

type ArtworkDetail = Artwork & { reviews?: ArtworkReview[] };

export default function ArtDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  // Purchase
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('India');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Reviews
  const [reviews, setReviews] = useState<ArtworkReview[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Similar art
  const [similar, setSimilar] = useState<Artwork[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const [artRes, revRes, simRes] = await Promise.allSettled([
          api.get<ArtworkDetail>(`/artworks/${id}`),
          api.get<ArtworkReview[]>(`/artworks/${id}/reviews`),
          api.get<Artwork[]>(`/artworks/${id}/similar`),
        ]);
        if (artRes.status === 'fulfilled') setArtwork(artRes.value.data);
        if (revRes.status === 'fulfilled') setReviews(Array.isArray(revRes.value.data) ? revRes.value.data : []);
        if (simRes.status === 'fulfilled') setSimilar(Array.isArray(simRes.value.data) ? simRes.value.data : []);
      } catch { /* noop */ } finally { setLoading(false); }
    };
    void fetch();
  }, [id]);

  const handleBuyNow = async () => {
    if (!artwork || artwork.status === 'SOLD') return;
    setPaymentError(''); setPaymentSuccess('');
    if (!user) { router.push('/login'); return; }
    if (!address || !city || !stateName || !zip || !country) {
      setPaymentError('Please fill the complete shipping address.'); return;
    }
    setPaymentLoading(true);
    try {
      await startPayment({
        payload: { purpose: 'ORDER', artworkId: artwork.id, shippingAddress: { address, city, state: stateName, zip, country } },
        name: 'KalaSetu',
        description: `Purchase: ${artwork.title}`,
        onSuccess: async ({ orderId }) => {
          await refreshProfile();
          try { const r = await api.get<ArtworkDetail>(`/artworks/${id}`); setArtwork(r.data); } catch { /* noop */ }
          setPaymentSuccess('Payment successful! Your order has been placed.');
          if (orderId) router.push('/orders');
        },
      });
    } catch (e: unknown) {
      setPaymentError(e instanceof Error ? e.message : 'Payment failed');
    } finally { setPaymentLoading(false); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setReviewError(''); setReviewSuccess(''); setReviewSubmitting(true);
    try {
      const res = await api.post<ArtworkReview>(`/artworks/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewComment(''); setReviewRating(5);
      setReviewSuccess('Review submitted!');
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally { setReviewSubmitting(false); }
  };

  if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading artwork...</div>;
  if (!artwork) return <div className="container" style={{ padding: '4rem' }}>Artwork not found.</div>;

  const images = artwork.images && artwork.images.length > 0 ? artwork.images : [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <Link href="/explore" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>← Back to Explore</Link>

      <div className={styles.grid} style={{ marginTop: 'var(--space-lg)' }}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImage} style={!images[activeImg] ? { background: `hsl(${parseInt(artwork.id.slice(0, 8), 16) % 360}, 40%, 25%)` } : {}}>
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={artwork.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : <span style={{ fontSize: '5rem', opacity: 0.4 }}>🎨</span>}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <img key={i} src={img} alt="" className={styles.thumb}
                  style={{ objectFit: 'cover', border: i === activeImg ? '2px solid var(--saffron)' : undefined, cursor: 'pointer' }}
                  onClick={() => setActiveImg(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div>
            <span className="badge badge-saffron">{artwork.category}</span>
            {artwork.status === 'SOLD' && <span className="badge" style={{ marginLeft: 8, background: '#EF4444', color: '#fff' }}>SOLD</span>}
            <h1 className={styles.title} style={{ marginTop: 'var(--space-sm)' }}>{artwork.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              by{' '}
              {artwork.artistId ? (
                <Link href={`/artist/${artwork.artistId}`} style={{ color: 'var(--saffron)' }}>{artwork.artist?.user.name || 'Unknown Artist'}</Link>
              ) : <span style={{ color: 'var(--text-secondary)' }}>{artwork.artist?.user.name || 'Unknown Artist'}</span>}
            </p>
            {avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{ color: '#F59E0B' }}>{'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          <div className={styles.priceSection}>
            <span className={styles.price}>₹{Number(artwork.price).toLocaleString('en-IN')}</span>
            <span className={styles.priceNote}>{artwork.status === 'SOLD' ? 'This artwork has been sold' : 'Original artwork · One of a kind'}</span>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>✓ Secure payment</span>
              <span>✓ Buyer protection</span>
              <span>✓ Authentic artwork</span>
            </div>
          </div>

          {artwork.status !== 'SOLD' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
              <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Shipping Address</h2>
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <input className="input-field" placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                  <input className="input-field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <input className="input-field" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} />
                  <input className="input-field" placeholder="PIN" value={zip} onChange={(e) => setZip(e.target.value)} />
                  <input className="input-field" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
              {paymentError && <p style={{ color: '#EF4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>{paymentError}</p>}
              {paymentSuccess && <p style={{ color: 'var(--teal-light)', marginTop: '0.5rem', fontSize: '0.875rem' }}>{paymentSuccess}</p>}
              <div className={styles.actions} style={{ marginTop: 'var(--space-md)' }}>
                <button className="btn btn-primary btn-lg" onClick={handleBuyNow} disabled={paymentLoading} style={{ flex: 1 }}>
                  {paymentLoading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>About this artwork</h2>
              <p className={styles.description}>{artwork.description || 'No description provided.'}</p>
            </div>
            <div className={styles.details}>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Medium</span><span>{artwork.medium || 'N/A'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Dimensions</span><span>{artwork.dimensions ? `${artwork.dimensions.width}×${artwork.dimensions.height} ${artwork.dimensions.unit}` : 'N/A'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Category</span><span>{artwork.category}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Views</span><span>{artwork.viewCount}</span></div>
            </div>
          </div>

          {/* Reviews */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
            <h2 style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              Reviews {reviews.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>({reviews.length})</span>}
            </h2>

            {/* Write review */}
            {user && artwork.status === 'SOLD' && (
              <form onSubmit={(e) => void handleSubmitReview(e)} style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Write a Review</p>
                <div style={{ display: 'flex', gap: 8, fontSize: '1.5rem' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button type="button" key={n} onClick={() => setReviewRating(n)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: n <= reviewRating ? '#F59E0B' : 'var(--text-muted)', fontSize: '1.4rem', padding: 0 }}>★</button>
                  ))}
                </div>
                <textarea className="input-field" rows={3} placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                {reviewError && <p style={{ color: '#EF4444', fontSize: '0.85rem' }}>{reviewError}</p>}
                {reviewSuccess && <p style={{ color: 'var(--teal-light)', fontSize: '0.85rem' }}>{reviewSuccess}</p>}
                <button type="submit" className="btn btn-primary btn-sm" disabled={reviewSubmitting}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button>
              </form>
            )}
            {user && artwork.status !== 'SOLD' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>Purchase this artwork to leave a review.</p>
            )}

            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{r.user?.name || 'User'}</strong>
                      <span style={{ color: '#F59E0B', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>{r.comment}</p>}
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>

      {/* Similar Art */}
      {similar.length > 0 && (
        <section style={{ marginTop: 'var(--space-3xl)' }}>
          <div className="section-header">
            <h2 className="section-title">Similar <span>Artworks</span></h2>
            <Link href={`/explore?category=${encodeURIComponent(artwork.category)}`} className="section-link">View All →</Link>
          </div>
          <div className="grid-art" style={{ marginTop: 'var(--space-lg)' }}>
            {similar.map(art => <ArtCard key={art.id} artwork={art} />)}
          </div>
        </section>
      )}
    </div>
  );
}
