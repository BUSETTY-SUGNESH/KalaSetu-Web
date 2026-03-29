'use client';
import { useState } from 'react';
import Link from 'next/link';
import EventCard from '@/components/cards/EventCard';
import { mockEvents } from '@/lib/mockData';
import styles from './page.module.css';

export default function KalentPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? mockEvents : mockEvents.filter(e => e.type === filter);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Kalent</h1>
        <p className={styles.heroDesc}>Grow your art journey through competitions, workshops, and exhibitions</p>
        <div className={styles.quickLinks}>
          <Link href="/kalent/competitions" className={styles.quickLink}>🏆 Competitions</Link>
          <Link href="/kalent/workshops" className={styles.quickLink}>🎓 Workshops</Link>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className="stat-card"><span className="stat-value">4</span><span className="stat-label">Upcoming Events</span></div>
        <div className="stat-card"><span className="stat-value">864</span><span className="stat-label">Participants</span></div>
        <div className="stat-card"><span className="stat-value">₹5L</span><span className="stat-label">Prize Pool</span></div>
      </div>

      <div className={styles.filters}>
        {[{ v: 'all', l: 'All Events' }, { v: 'COMPETITION', l: '🏆 Competitions' }, { v: 'WORKSHOP', l: '🎓 Workshops' }, { v: 'EXHIBITION', l: '🏛️ Exhibitions' }].map(f => (
          <button key={f.v} className={`tag ${filter === f.v ? 'active' : ''}`} onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>

      <div className="grid-events">
        {filtered.map(event => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}
