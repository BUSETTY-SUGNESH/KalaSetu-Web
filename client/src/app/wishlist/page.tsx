"use client";

import { useEffect, useMemo, useState } from 'react';
import ArtCard from '@/components/cards/ArtCard';
import api from '@/lib/api';
import { Artwork } from '@/types';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const getWishlistKey = (userId: string) => `wishlist:${userId}`;

export default function WishlistPage() {
  const { user, loading } = useRequireAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(getWishlistKey(user.id));
    if (!raw) {
      setWishlistIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setWishlistIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setWishlistIds([]);
    }
  }, [user]);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const res = await api.get('/artworks');
        setArtworks(Array.isArray(res.data) ? res.data : []);
      } catch {
        setArtworks([]);
      }
    };

    void fetchArtworks();
  }, []);

  const wishlistedArt = useMemo(() => {
    if (wishlistIds.length === 0) {
      return [];
    }

    return artworks.filter((item) => wishlistIds.includes(item.id));
  }, [artworks, wishlistIds]);

  if (loading || !user) {
    return <div className="container" style={{ padding: '4rem' }}>Loading wishlist...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <h1 className="section-title">My <span>Wishlist</span></h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>{wishlistedArt.length} items saved</p>

      {wishlistedArt.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          Your wishlist is empty. Tap the heart icon on artworks to save items.
        </div>
      ) : (
        <div className="grid-art">
          {wishlistedArt.map((art) => <ArtCard key={art.id} artwork={art} />)}
        </div>
      )}
    </div>
  );
}
