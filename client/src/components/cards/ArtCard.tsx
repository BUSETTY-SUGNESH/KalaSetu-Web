"use client";

import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Cards.module.css';
import { useAuth } from '@/context/AuthContext';
import { Artwork } from '@/types';

const getWishlistKey = (userId: string) => `wishlist:${userId}`;

export default function ArtCard({ artwork }: { artwork: Artwork }) {
  const router = useRouter();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      setWishlisted(false);
      return;
    }

    const raw = window.localStorage.getItem(getWishlistKey(user.id));
    if (!raw) {
      setWishlisted(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setWishlisted(Array.isArray(parsed) && parsed.includes(artwork.id));
    } catch {
      setWishlisted(false);
    }
  }, [artwork.id, user]);

  const toggleWishlist = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    const storageKey = getWishlistKey(user.id);
    const raw = window.localStorage.getItem(storageKey);
    let ids: string[] = [];

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        ids = Array.isArray(parsed) ? parsed : [];
      } catch {
        ids = [];
      }
    }

    const nextIds = ids.includes(artwork.id)
      ? ids.filter((id) => id !== artwork.id)
      : [...ids, artwork.id];

    window.localStorage.setItem(storageKey, JSON.stringify(nextIds));
    setWishlisted(nextIds.includes(artwork.id));
  };

  const artistName = artwork.artist?.user.name || 'Unknown Artist';
  return (
    <Link href={`/art/${artwork.id}`} className={`card ${styles.artCard}`}>
      <div className={styles.artImage}>
        <div className={styles.artPlaceholder} style={{ background: `hsl(${parseInt(artwork.id.slice(0, 8), 16) % 360}, 40%, 25%)` }}>
          <span className={styles.artEmoji}>🎨</span>
        </div>
        <div className={styles.artOverlay}>
          <button
            className={styles.wishlistBtn}
            onClick={toggleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={wishlisted ? { color: '#EF4444' } : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <span className={`badge badge-saffron ${styles.categoryBadge}`}>{artwork.category}</span>
      </div>
      <div className={styles.artInfo}>
        <h3 className={styles.artTitle}>{artwork.title}</h3>
        <p className={styles.artArtist}>{artistName}</p>
        <div className={styles.artBottom}>
          <span className={styles.artPrice}>₹{artwork.price.toLocaleString('en-IN')}</span>
          <span className={styles.artViews}>{artwork.viewCount} views</span>
        </div>
      </div>
    </Link>
  );
}
