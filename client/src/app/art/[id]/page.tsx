'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Artwork } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { startPayment } from '@/lib/payment';
import styles from './page.module.css';

interface ArtworkReview {
  id: string;
  rating: number;
  comment?: string | null;
  user?: {
    name?: string;
  };
}

type ArtworkDetail = Artwork & {
  reviews?: ArtworkReview[];
};

export default function ArtDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('India');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await api.get<ArtworkDetail>(`/artworks/${id}`);
        setArtwork(res.data);
      } catch (error) {
        console.error('Failed to fetch artwork', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchArtwork();
    }
  }, [id]);

  const handleBuyNow = async () => {
    if (!artwork || artwork.status === 'SOLD') {
      return;
    }

    setPaymentError('');
    setPaymentSuccess('');

    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.isVerified) {
      setPaymentError('Only verified users can complete payments.');
      return;
    }

    if (!address || !city || !stateName || !zip || !country) {
      setPaymentError('Please fill the complete shipping address before payment.');
      return;
    }

    setPaymentLoading(true);
    try {
      await startPayment({
        payload: {
          purpose: 'ORDER',
          artworkId: artwork.id,
          shippingAddress: {
            address,
            city,
            state: stateName,
            zip,
            country,
          },
        },
        name: 'KalaSetu',
        description: `Purchase: ${artwork.title}`,
        onSuccess: async ({ orderId }) => {
          await refreshProfile();
          try {
            const res = await api.get<ArtworkDetail>(`/artworks/${id}`);
            setArtwork(res.data);
          } catch {
            /* ignore refetch error */
          }
          setPaymentSuccess('Payment successful. Your order has been placed.');
          if (orderId) {
            router.push('/orders');
          }
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setPaymentError(error.message);
      } else {
        setPaymentError('Payment failed');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading artwork...</div>;
  if (!artwork) return <div className="container" style={{ padding: '4rem' }}>Artwork not found.</div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <Link href="/explore" className={styles.backLink}>Back to Explore</Link>

      <div className={styles.grid}>
        <div className={styles.visual}>
          <div className={styles.imagePlaceholder} style={{ background: `hsl(${parseInt(artwork.id.slice(0, 8), 16) % 360}, 40%, 25%)` }}>
            <span style={{ fontSize: '5rem' }}>Art</span>
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.header}>
            <span className="badge badge-saffron">{artwork.category}</span>
            <h1 className={styles.title}>{artwork.title}</h1>
            <p className={styles.artist}>by <span>{artwork.artist?.user.name || 'Unknown Artist'}</span></p>
          </div>

          <div className={styles.priceSection}>
            <span className={styles.price}>Rs {Number(artwork.price).toLocaleString('en-IN')}</span>
            <span className={styles.status}>{artwork.status}</span>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-primary btn-lg" onClick={handleBuyNow} disabled={artwork.status === 'SOLD' || paymentLoading}>
              {artwork.status === 'SOLD' ? 'Sold Out' : 'Buy Now'}
            </button>
            <button className="btn btn-secondary btn-lg">Make an Offer</button>
          </div>

          {paymentError && <p style={{ color: '#EF4444', marginTop: 'var(--space-sm)' }}>{paymentError}</p>}
          {paymentSuccess && <p style={{ color: 'var(--teal-light)', marginTop: 'var(--space-sm)' }}>{paymentSuccess}</p>}

          <div style={{ marginTop: 'var(--space-lg)' }}>
            <h2 className={styles.sectionTitle}>Shipping Address</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input className="input-field" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <input className="input-field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <input className="input-field" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} />
                <input className="input-field" placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
                <input className="input-field" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.details}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <p className={styles.description}>{artwork.description || 'No description provided.'}</p>

            <h2 className={styles.sectionTitle} style={{ marginTop: 'var(--space-lg)' }}>Details</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Medium</span>
                <span className={styles.detailValue}>{artwork.medium || 'N/A'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Dimensions</span>
                <span className={styles.detailValue}>
                  {artwork.dimensions ? `${artwork.dimensions.width} x ${artwork.dimensions.height} ${artwork.dimensions.unit}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.details} style={{ marginTop: 'var(--space-lg)' }}>
            <h2 className={styles.sectionTitle}>Reviews</h2>
            {Array.isArray(artwork.reviews) && artwork.reviews.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {artwork.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <strong>{review.user?.name || 'User'}</strong>
                      <span>⭐ {review.rating}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>{review.comment || 'No comment'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
