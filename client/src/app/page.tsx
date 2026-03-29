import styles from './page.module.css';
import Link from 'next/link';
import ArtCard from '@/components/cards/ArtCard';
import ArtistCard from '@/components/cards/ArtistCard';
import BidCard from '@/components/cards/BidCard';
import EventCard from '@/components/cards/EventCard';
import DiscussionCard from '@/components/cards/DiscussionCard';
import { mockArtworks, mockArtists, mockBids, mockEvents, mockDiscussions, categories, testimonials } from '@/lib/mockData';

export default function HomePage() {
  return (
    <>
      {/* ══════ HERO ══════ */}
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
                <span className={styles.heroStatValue}>2,500+</span>
                <span className={styles.heroStatLabel}>Artworks</span>
              </div>
              <div className={styles.heroStatDivider}/>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>400+</span>
                <span className={styles.heroStatLabel}>Artists</span>
              </div>
              <div className={styles.heroStatDivider}/>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>50K+</span>
                <span className={styles.heroStatLabel}>Art Lovers</span>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard} style={{ background: 'hsl(25, 40%, 25%)' }}>
              <span style={{ fontSize: '4rem' }}>🎨</span>
              <span className={styles.heroCardTitle}>Featured Art</span>
            </div>
            <div className={styles.heroFloating1}>
              <span className={styles.heroFloatingBid}>₹32,500</span>
              <span className={styles.heroFloatingLabel}>Current Bid</span>
            </div>
            <div className={styles.heroFloating2}>
              <span>⭐ 4.9</span>
              <span>Top Rated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ CATEGORIES ══════ */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Explore <span>Categories</span></h2>
            <Link href="/explore" className="section-link">View All →</Link>
          </div>
          <div className={styles.catGrid}>
            {categories.map(cat => (
              <Link key={cat.name} href={`/explore?category=${cat.name.toLowerCase()}`} className={styles.catCard}>
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catName}>{cat.name}</span>
                <span className={styles.catCount}>{cat.count} works</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FEATURED ARTISTS ══════ */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured <span>Artists</span></h2>
            <Link href="/explore?tab=artists" className="section-link">View All →</Link>
          </div>
          <div className="grid-artists">
            {mockArtists.slice(0, 6).map(artist => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ LIVE BIDS ══════ */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Live <span>Bids</span></h2>
            <Link href="/bid" className="section-link">View All →</Link>
          </div>
          <div className="hscroll">
            {mockBids.map(bid => (
              <BidCard key={bid.id} bid={bid} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TRENDING ART ══════ */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trending <span>Art</span></h2>
            <Link href="/explore" className="section-link">View All →</Link>
          </div>
          <div className="grid-art">
            {mockArtworks.slice(0, 8).map(art => (
              <ArtCard key={art.id} artwork={art} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ KALENT HIGHLIGHTS ══════ */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Kalent <span>Highlights</span></h2>
            <Link href="/kalent" className="section-link">View All →</Link>
          </div>
          <div className="grid-events">
            {mockEvents.slice(0, 3).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CHARCHA HIGHLIGHTS ══════ */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Charcha <span>Sabha</span></h2>
            <Link href="/charcha" className="section-link">Join Discussion →</Link>
          </div>
          <div className={styles.discussionList}>
            {mockDiscussions.slice(0, 3).map(d => (
              <DiscussionCard key={d.id} discussion={d} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trusted by <span>Art Lovers</span></h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>{'⭐'.repeat(t.rating)}</div>
                <p className={styles.testimonialText}>&ldquo;{t.text}&rdquo;</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar} style={{ background: `hsl(${i * 90}, 45%, 35%)` }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <span className={styles.testimonialName}>{t.name}</span>
                    <span className={styles.testimonialRole}>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
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
