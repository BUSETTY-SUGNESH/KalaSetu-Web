'use client';
import { useState } from 'react';
import ArtCard from '@/components/cards/ArtCard';
import ArtistCard from '@/components/cards/ArtistCard';
import { mockArtworks, mockArtists, categories } from '@/lib/mockData';
import styles from './page.module.css';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'art' | 'artists'>('art');
  const [activeCategory, setActiveCategory] = useState('All');
  const allCategories = ['All', ...categories.map(c => c.name)];

  const filteredArt = activeCategory === 'All' ? mockArtworks : mockArtworks.filter(a => a.category === activeCategory);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)' }}>
      <div className={styles.header}>
        <h1 className="section-title">Explore <span>Art & Artists</span></h1>
        <p className={styles.subtitle}>Discover masterpieces from India&apos;s finest verified artists</p>
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-xl)' }}>
        <button className={`tab ${activeTab === 'art' ? 'active' : ''}`} onClick={() => setActiveTab('art')}>Artworks</button>
        <button className={`tab ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => setActiveTab('artists')}>Artists</button>
      </div>

      {activeTab === 'art' && (
        <>
          <div className={styles.filters}>
            {allCategories.map(cat => (
              <button key={cat} className={`tag ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
          <div className={styles.resultsBar}>
            <span>{filteredArt.length} artworks found</span>
            <select className={`input-field ${styles.sortSelect}`}>
              <option>Trending</option>
              <option>Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
          <div className="grid-art" style={{ paddingBottom: 'var(--space-3xl)' }}>
            {filteredArt.map(art => <ArtCard key={art.id} art={art} />)}
          </div>
        </>
      )}

      {activeTab === 'artists' && (
        <div className="grid-artists" style={{ paddingBottom: 'var(--space-3xl)' }}>
          {mockArtists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}
        </div>
      )}
    </div>
  );
}
