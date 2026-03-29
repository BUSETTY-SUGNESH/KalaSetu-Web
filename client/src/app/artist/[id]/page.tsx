'use client';
import { use } from 'react';
import { mockArtists, mockArtworks } from '@/lib/mockData';
import ArtCard from '@/components/cards/ArtCard';
import styles from './page.module.css';

export default function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artist = mockArtists.find(a => a.id === id) || mockArtists[0];
  const artworks = mockArtworks.filter(a => a.artistId === artist.id);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.profile}>
        <div className={styles.avatar} style={{ background: `hsl(${artist.name.length * 37 % 360}, 45%, 30%)` }}>
          {artist.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{artist.name}</h1>
          <div className={styles.tags}>
            <span className="badge badge-saffron">{artist.specialty}</span>
            <span className="badge badge-teal">✓ Verified</span>
            <span className="badge badge-purple">{artist.region}</span>
          </div>
          <p className={styles.bio}>{artist.bio}</p>
          <div className={styles.stats}>
            <div className="stat-card"><span className="stat-value">{artist.rating}</span><span className="stat-label">Rating</span></div>
            <div className="stat-card"><span className="stat-value">{artist.totalSales}</span><span className="stat-label">Sales</span></div>
            <div className="stat-card"><span className="stat-value">{artworks.length}</span><span className="stat-label">Artworks</span></div>
          </div>
          <div className={styles.actions}>
            <button className="btn btn-primary">Follow Artist</button>
            <button className="btn btn-secondary">Message</button>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 'var(--space-3xl)' }}>
        <h2 className="section-title">Artworks by <span>{artist.name.split(' ')[0]}</span></h2>
        <div className="grid-art" style={{ marginTop: 'var(--space-lg)' }}>
          {artworks.length > 0 ? artworks.map(a => <ArtCard key={a.id} art={a} />) :
            <div className="empty-state"><div className="empty-state-icon">🎨</div><p className="empty-state-title">No artworks yet</p></div>
          }
        </div>
      </section>
    </div>
  );
}
