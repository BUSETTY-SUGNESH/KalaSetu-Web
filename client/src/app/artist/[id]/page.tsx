'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import ArtCard from '@/components/cards/ArtCard';
import { Artist, Artwork } from '@/types';
import styles from './page.module.css';

export default function ArtistProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [artist, setArtist] = useState<(Artist & { artworks?: Artwork[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const res = await api.get<Artist & { artworks?: Artwork[] }>(`/users/artists/${id}`);
        setArtist(res.data);
      } catch {
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchArtist();
    }
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem' }}>Loading artist profile...</div>;
  }

  if (!artist) {
    return <div className="container" style={{ padding: '4rem' }}>Artist not found.</div>;
  }

  const artworks = artist.artworks || [];
  const artistName = artist.name || 'Unknown Artist';

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.profile}>
        <div className={styles.avatar} style={{ background: `hsl(${artistName.length * 37 % 360}, 45%, 30%)` }}>
          {artistName.split(' ').map((n) => n[0]).join('')}
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{artistName}</h1>
          <div className={styles.tags}>
            <span className="badge badge-saffron">{artist.specialty || 'Artist'}</span>
            <span className="badge badge-teal">✓ Verified</span>
            <span className="badge badge-purple">{artist.region || 'India'}</span>
          </div>
          <p className={styles.bio}>{artist.bio || 'No bio available.'}</p>
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
        <h2 className="section-title">Artworks by <span>{artistName.split(' ')[0]}</span></h2>
        <div className="grid-art" style={{ marginTop: 'var(--space-lg)' }}>
          {artworks.length > 0 ? artworks.map(a => <ArtCard key={a.id} artwork={a} />) :
            <div className="empty-state"><div className="empty-state-icon">🎨</div><p className="empty-state-title">No artworks yet</p></div>
          }
        </div>
      </section>
    </div>
  );
}
