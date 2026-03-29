'use client';
import { use } from 'react';
import Link from 'next/link';
import { mockArtworks } from '@/lib/mockData';
import ArtCard from '@/components/cards/ArtCard';
import styles from './page.module.css';

export default function ArtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const art = mockArtworks.find(a => a.id === id) || mockArtworks[0];
  const relatedArt = mockArtworks.filter(a => a.id !== art.id && a.category === art.category).slice(0, 4);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link> / <Link href="/explore">Explore</Link> / <span>{art.title}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.gallery}>
          <div className={styles.mainImage} style={{ background: `hsl(${parseInt(art.id) * 47 % 360}, 40%, 25%)` }}>
            <span style={{ fontSize: '5rem', opacity: 0.4 }}>🎨</span>
          </div>
          <div className={styles.thumbs}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.thumb} style={{ background: `hsl(${(parseInt(art.id) * 47 + i * 30) % 360}, 35%, 22%)` }}/>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <span className={`badge badge-saffron`}>{art.category}</span>
          <h1 className={styles.title}>{art.title}</h1>

          <Link href={`/artist/${art.artistId}`} className={styles.artistRow}>
            <div className={styles.artistAvatar} style={{ background: `hsl(${art.artistName.length * 37 % 360}, 45%, 30%)` }}>
              {art.artistName[0]}
            </div>
            <div>
              <span className={styles.artistName}>{art.artistName}</span>
              <span className={styles.verified}>✓ Verified Artist</span>
            </div>
          </Link>

          <p className={styles.description}>{art.description}</p>

          <div className={styles.details}>
            {art.medium && <div className={styles.detailItem}><span className={styles.detailLabel}>Medium</span><span>{art.medium}</span></div>}
            {art.dimensions && <div className={styles.detailItem}><span className={styles.detailLabel}>Dimensions</span><span>{art.dimensions.width} × {art.dimensions.height} {art.dimensions.unit}</span></div>}
            <div className={styles.detailItem}><span className={styles.detailLabel}>Views</span><span>{art.viewCount}</span></div>
          </div>

          <div className={styles.priceSection}>
            <span className={styles.price}>₹{art.price.toLocaleString('en-IN')}</span>
            <span className={styles.priceNote}>Inclusive of all taxes</span>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }}>Buy Now</button>
            <button className="btn btn-secondary btn-lg" style={{ flex: 1 }}>Add to Cart</button>
            <button className="btn btn-ghost btn-icon" aria-label="Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>

          <div className={styles.trust}>
            <div className={styles.trustItem}>🔒 Secure Payment</div>
            <div className={styles.trustItem}>📦 Free Shipping</div>
            <div className={styles.trustItem}>🔄 7-Day Returns</div>
          </div>
        </div>
      </div>

      {relatedArt.length > 0 && (
        <section style={{ marginTop: 'var(--space-3xl)' }}>
          <h2 className="section-title">Related <span>Art</span></h2>
          <div className="grid-art" style={{ marginTop: 'var(--space-lg)' }}>
            {relatedArt.map(a => <ArtCard key={a.id} art={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
