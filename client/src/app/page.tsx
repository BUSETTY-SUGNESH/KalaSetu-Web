'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import ArtCard from '@/components/cards/ArtCard';
import ArtistCard from '@/components/cards/ArtistCard';
import BidCard from '@/components/cards/BidCard';
import EventCard from '@/components/cards/EventCard';
import DiscussionCard from '@/components/cards/DiscussionCard';
import api from '@/lib/api';
import { Artist, Artwork, Bid, Discussion, KalentEvent } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  Painting: '🖌️', Sculpture: '🗿', 'Digital Art': '💻', Textile: '🧵',
  Photography: '📷', 'Mixed Media': '🎭', Other: '🎨',
};

export default function HomePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [events, setEvents] = useState<KalentEvent[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      const endpoints = [
        () => api.get('/artworks'),
        () => api.get('/users/artists'),
        () => api.get('/bids/active'),
        () => api.get('/events'),
        () => api.get('/discussions'),
      ] as const;

      const settled = await Promise.allSettled(endpoints.map((fn) => fn()));

      const pick = (i: number) => {
        const r = settled[i];
        if (r.status !== 'fulfilled') {
          return [];
        }
        const data = r.value.data;
        return Array.isArray(data) ? data : [];
      };

      setArtworks(pick(0) as Artwork[]);
      setArtists(pick(1) as Artist[]);
      setBids(pick(2) as Bid[]);
      setEvents(pick(3) as KalentEvent[]);
      setDiscussions(pick(4) as Discussion[]);
      setLoading(false);
    };

    void fetchHomeData();
  }, []);

  const categories = useMemo(() => {
    const counts = artworks.reduce<Record<string, number>>((acc, artwork) => {
      const category = artwork.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [artworks]);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroOrbs}>
          <div className={styles.orb1}/>
          <div className={styles.orb2}/>
          <div className={styles.orb3}/>
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>🎨 India&apos;s #1 Cultural Marketplace</span>
            <h1 className={styles.heroTitle}>
              Where <span>Art</span> Meets<br/>
              Its True <span>Setu</span>
            </h1>
            <p className={styles.heroDesc}>
              Discover authentic Indian art from verified artists across the nation. 
              Buy, bid, and connect with a vibrant community of art lovers.
            </p>
            <div className={styles.heroActions}>
              <Link href="/explore" className="btn btn-primary btn-lg">Explore Art</Link>
              <Link href="/bid" className="btn btn-secondary btn-lg">Live Bids</Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{artworks.length.toLocaleString('en-IN')}+</span>
                <span className={styles.heroStatLabel}>Artworks</span>
              </div>
              <div className={styles.heroStatDivider}/>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{artists.length.toLocaleString('en-IN')}+</span>
                <span className={styles.heroStatLabel}>Artists</span>
              </div>
              <div className={styles.heroStatDivider}/>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{discussions.length.toLocaleString('en-IN')}+</span>
                <span className={styles.heroStatLabel}>Discussions</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard} style={artworks[0]?.images?.[0] ? { background: 'transparent', overflow: 'hidden', padding: 0 } : { background: 'hsl(25, 40%, 25%)' }}>
              {artworks[0]?.images?.[0] ? (
                <img src={artworks[0].images[0]} alt={artworks[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : <span style={{ fontSize: '4rem' }}>🎨</span>}
              {!artworks[0]?.images?.[0] && <span className={styles.heroCardTitle}>Featured Art</span>}
            </div>
            <div className={styles.heroFloating1}>
              <span className={styles.heroFloatingBid}>₹{(bids.length ? Math.max(...bids.map((bid) => Number(bid.currentHighest) || 0)) : 0).toLocaleString('en-IN')}</span>
              <span className={styles.heroFloatingLabel}>Current Bid</span>
            </div>
            <div className={styles.heroFloating2}>
              <span>⭐ 4.9</span>
              <span>Top Rated</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Explore <span>Categories</span></h2>
            <Link href="/explore" className="section-link">View All →</Link>
          </div>
          {categories.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No products available</p>
          ) : (
            <div className={styles.catGrid}>
              {categories.map((cat) => (
                <Link key={cat.name} href={`/explore?category=${encodeURIComponent(cat.name)}`} className={styles.catCard}>
                  <span className={styles.catIcon}>{CATEGORY_ICONS[cat.name] ?? '🎨'}</span>
                  <span className={styles.catName}>{cat.name}</span>
                  <span className={styles.catCount}>{cat.count} works</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured <span>Artists</span></h2>
            <Link href="/explore?tab=artists" className="section-link">View All →</Link>
          </div>
          {artists.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No artists available</p>
          ) : (
            <div className="grid-artists">
              {artists.slice(0, 6).map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Live <span>Bids</span></h2>
            <Link href="/bid" className="section-link">View All →</Link>
          </div>
          {bids.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No active bids</p>
          ) : (
            <div className="hscroll">
              {bids.map((bid) => (
                <BidCard key={bid.id} bid={bid} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trending <span>Art</span></h2>
            <Link href="/explore?sort=popular" className="section-link">View All →</Link>
          </div>
          {artworks.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No products available</p>
          ) : (
            <div className="grid-art">
              {[...artworks].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8).map((art) => (
                <ArtCard key={art.id} artwork={art} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">New <span>Arrivals</span></h2>
            <Link href="/explore?sort=newest" className="section-link">View All →</Link>
          </div>
          {artworks.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No artworks yet</p>
          ) : (
            <div className="grid-art">
              {[...artworks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8).map((art) => (
                <ArtCard key={art.id} artwork={art} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Kalent <span>Highlights</span></h2>
            <Link href="/kalent" className="section-link">View All →</Link>
          </div>
          {events.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No events available</p>
          ) : (
            <div className="grid-events">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Charcha <span>Sabha</span></h2>
            <Link href="/charcha" className="section-link">Join Discussion →</Link>
          </div>
          {discussions.length === 0 && !loading ? (
            <p style={{ color: 'var(--text-muted)' }}>No discussions yet</p>
          ) : (
            <div className={styles.discussionList}>
              {discussions.slice(0, 3).map((discussion) => (
                <DiscussionCard key={discussion.id} discussion={discussion} />
              ))}
            </div>
          )}
        </div>
      </section>
      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Bridge the Gap<br/>Between Art & You?</h2>
          <p className={styles.ctaDesc}>Join thousands of artists and art lovers on India&apos;s most vibrant cultural marketplace.</p>
          <div className={styles.ctaActions}>
            <Link href="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link href="/explore" className="btn btn-secondary btn-lg">Browse Art</Link>
          </div>
        </div>
      </section>
    </>
  );
}
