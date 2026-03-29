'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Artwork } from '@/types';
import styles from './page.module.css';

export default function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const res = await api.get(`/artworks/${id}`);
        setArtwork(res.data);
      } catch (error) {
        console.error('Failed to fetch artwork', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtwork();
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '4rem' }}>Loading masterpiece...</div>;
  if (!artwork) return <div className="container" style={{ padding: '4rem' }}>Masterpiece not found.</div>;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <Link href="/explore" className={styles.backLink}>← Back to Explore</Link>
      
      <div className={styles.grid}>
        <div className={styles.visual}>
          <div className={styles.imagePlaceholder} style={{ background: `hsl(${parseInt(artwork.id.slice(0, 8), 16) % 360}, 40%, 25%)` }}>
            <span style={{ fontSize: '5rem' }}>🎨</span>
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.header}>
            <span className="badge badge-saffron">{artwork.category}</span>
            <h1 className={styles.title}>{artwork.title}</h1>
            <p className={styles.artist}>by <span>{artwork.artist?.user.name}</span></p>
          </div>

          <div className={styles.priceSection}>
            <span className={styles.price}>₹{artwork.price.toLocaleString('en-IN')}</span>
            <span className={styles.status}>{artwork.status}</span>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-primary btn-lg" disabled={artwork.status === 'SOLD'}>
              {artwork.status === 'SOLD' ? 'Sold Out' : 'Buy Now'}
            </button>
            <button className="btn btn-secondary btn-lg">Make an Offer</button>
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
        </div>
      </div>
    </div>
  );
