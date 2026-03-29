import Link from 'next/link';
import styles from './Cards.module.css';
import { Artwork } from '@/types';

export default function ArtCard({ art }: { art: Artwork }) {
  return (
    <Link href={`/art/${art.id}`} className={`card ${styles.artCard}`}>
      <div className={styles.artImage}>
        <div className={styles.artPlaceholder} style={{ background: `hsl(${parseInt(art.id) * 47 % 360}, 40%, 25%)` }}>
          <span className={styles.artEmoji}>🎨</span>
        </div>
        <div className={styles.artOverlay}>
          <button className={styles.wishlistBtn} onClick={e => { e.preventDefault(); }} aria-label="Add to wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <span className={`badge badge-saffron ${styles.categoryBadge}`}>{art.category}</span>
      </div>
      <div className={styles.artInfo}>
        <h3 className={styles.artTitle}>{art.title}</h3>
        <p className={styles.artArtist}>{art.artistName}</p>
        <div className={styles.artBottom}>
          <span className={styles.artPrice}>₹{art.price.toLocaleString('en-IN')}</span>
          <span className={styles.artViews}>{art.viewCount} views</span>
        </div>
      </div>
    </Link>
  );
}
