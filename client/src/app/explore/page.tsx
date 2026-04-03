'use client';
import { useState, useEffect } from 'react';
import ArtCard from '@/components/cards/ArtCard';
import api from '@/lib/api';
import { Artwork } from '@/types';
import styles from './page.module.css';

export default function ExplorePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (category !== 'All') params.category = category;
        const res = await api.get('/artworks', { params });
        setArtworks(res.data);
      } catch (error) {
        console.error('Failed to fetch artworks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtworks();
  }, [category]);

  const categories = ['All', 'Painting', 'Sculpture', 'Digital Art', 'Textile', 'Photography', 'Mixed Media'];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <header className={styles.header}>
        <h1 className="section-title">Explore <span>Art</span></h1>
        <p className={styles.subtitle}>Discover authentic masterpieces from across India</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.categories}>
          {categories.map(c => (
            <button 
              key={c} 
              className={`${styles.filterBtn} ${category === c ? styles.active : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading masterpieces...</div>
      ) : artworks.length > 0 ? (
        <div className="grid-art">
          {artworks.map(art => (
            <ArtCard key={art.id} artwork={art} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No artworks found in this category.
        </div>
      )}
    </div>
  );
}
